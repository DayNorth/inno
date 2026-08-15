/**
 * Puerta unica de red.
 *
 * Todo lo que sale hacia el backend pasa por aqui: cabeceras, timeout,
 * correlacion, renovacion del access token y verificacion de contrato.
 *
 * Este es el UNICO modulo autorizado a importar `almacenToken` (regla
 * `no-restricted-imports` en eslint.config.js). Quien necesite manipular el
 * token usa las funciones exportadas de aqui.
 */
import { entorno } from "@/shared/config/entorno";
import { logger } from "@/shared/observabilidad/logger";
import { ErrorDeContrato } from "@/shared/verificar/primitivas";
import { ApiError } from "./ApiError";
import { CABECERA_CORRELACION, nuevoCorrelationId } from "./correlacion";
import {
  guardarAccessToken,
  limpiarAccessToken,
  obtenerAccessToken,
} from "./almacenToken";

export type Metodo = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface OpcionesPeticion {
  readonly metodo?: Metodo;
  readonly cuerpo?: unknown;
  /** El `request.signal` del loader: cancela al navegar fuera. */
  readonly signal?: AbortSignal | undefined;
  readonly timeoutMs?: number;
}

/** Rutas publicas: no llevan Authorization ni intentan renovar en un 401. */
const RUTAS_PUBLICAS: readonly string[] = [
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/logout",
];

/**
 * `credentials: "include"` SOLO en `/api/auth/*`. Mandar la cookie al resto de
 * la API ampliaria la superficie CSRF sin ninguna ganancia, y la cookie ademas
 * lleva `Path=/api/auth`, asi que el navegador no la enviaria de todos modos.
 *
 * `login` esta en la lista aunque `contrato-api.md` §1.2 solo nombre refresh y
 * logout: el login es quien RECIBE el `Set-Cookie` del refresh token, y con
 * `credentials: "omit"` el navegador descarta esa cabecera en una peticion
 * cross-origin (5173 -> 3001). Sin esto nunca hay cookie, la rehidratacion
 * falla y recargar la pagina cierra la sesion.
 */
const RUTAS_CON_COOKIE: readonly string[] = [
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/logout",
];

// --- Ciclo de vida del access token -----------------------------------------

export function establecerAccessToken(token: string): void {
  guardarAccessToken(token);
}

export function olvidarAccessToken(): void {
  limpiarAccessToken();
}

type ManejadorPerdida = () => void;
let alPerderSesion: ManejadorPerdida = () => {};

/**
 * `shared/auth/sesion.ts` se registra aqui para enterarse de que la renovacion
 * fallo. Es una inyeccion de dependencia por callback, para no crear un ciclo
 * de imports entre la capa de red y la de sesion.
 */
export function registrarPerdidaDeSesion(manejador: ManejadorPerdida): void {
  alPerderSesion = manejador;
}

// --- Renovacion (single-flight) ---------------------------------------------

let refrescoEnCurso: Promise<string | null> | null = null;

/**
 * Pide un access token nuevo con la cookie de refresh.
 *
 * Single-flight: si tres peticiones reciben 401 a la vez, solo sale un
 * `POST /api/auth/refresh`. Sin esto, cada 401 rotaria el refresh token y la
 * deteccion de reuso del backend (ADR-003) cerraria la sesion entera.
 */
export function renovarAccessToken(): Promise<string | null> {
  refrescoEnCurso ??= (async () => {
    try {
      const crudo = await ejecutar("/api/auth/refresh", { metodo: "POST" }, false);
      const token =
        typeof crudo === "object" && crudo !== null && "token" in crudo
          ? crudo.token
          : null;

      if (typeof token !== "string" || token === "") return null;

      guardarAccessToken(token);
      return token;
    } catch {
      // El 401 de refresh es neutro por contrato: no se deduce la causa.
      return null;
    } finally {
      refrescoEnCurso = null;
    }
  })();

  return refrescoEnCurso;
}

// --- Peticion ----------------------------------------------------------------

interface RespuestaCruda {
  readonly estado: number;
  readonly ok: boolean;
  readonly cuerpo: unknown;
}

function mensajeDelCuerpo(cuerpo: unknown, porDefecto: string): string {
  if (typeof cuerpo === "object" && cuerpo !== null && "mensaje" in cuerpo) {
    const m: unknown = cuerpo.mensaje;
    if (typeof m === "string" && m !== "") return m;
  }
  return porDefecto;
}

async function enviar(
  ruta: string,
  opciones: OpcionesPeticion,
  correlationId: string,
): Promise<RespuestaCruda> {
  const metodo = opciones.metodo ?? "GET";
  const publica = RUTAS_PUBLICAS.includes(ruta);
  const token = publica ? null : obtenerAccessToken();

  const cabeceras = new Headers({
    Accept: "application/json",
    [CABECERA_CORRELACION]: correlationId,
  });
  if (opciones.cuerpo !== undefined) {
    cabeceras.set("Content-Type", "application/json");
  }
  if (token !== null) {
    cabeceras.set("Authorization", `Bearer ${token}`);
  }

  const control = new AbortController();
  let expiro = false;

  const temporizador = setTimeout(() => {
    expiro = true;
    control.abort();
  }, opciones.timeoutMs ?? entorno.timeoutMs);

  const abortarExterno = (): void => {
    control.abort();
  };
  opciones.signal?.addEventListener("abort", abortarExterno, { once: true });

  try {
    const respuesta = await fetch(entorno.apiUrl + ruta, {
      method: metodo,
      headers: cabeceras,
      // Ni cache HTTP ni back/forward cache para datos con PII (§9.1).
      cache: "no-store",
      credentials: RUTAS_CON_COOKIE.includes(ruta) ? "include" : "omit",
      signal: control.signal,
      ...(opciones.cuerpo === undefined
        ? {}
        : { body: JSON.stringify(opciones.cuerpo) }),
    });

    let cuerpo: unknown = null;
    if (respuesta.status !== 204) {
      cuerpo = await respuesta.json().catch(() => null);
    }

    return { estado: respuesta.status, ok: respuesta.ok, cuerpo };
  } catch (e) {
    if (expiro) {
      throw new ApiError(
        "El servidor tardo demasiado en responder.",
        0,
        "timeout",
        correlationId,
      );
    }
    if (opciones.signal?.aborted === true) {
      throw new ApiError("Peticion cancelada.", 0, "cancelado", correlationId);
    }
    // Ni respuesta ni abort: red caida, DNS, CORS. El detalle real no se
    // muestra: podria revelar infraestructura.
    logger.warn("Fallo de red", { ruta, correlationId, tipo: nombreDe(e) });
    throw new ApiError(
      "No se pudo contactar con el servidor. Revisa tu conexion.",
      0,
      "red",
      correlationId,
    );
  } finally {
    clearTimeout(temporizador);
    opciones.signal?.removeEventListener("abort", abortarExterno);
  }
}

const nombreDe = (e: unknown): string =>
  e instanceof Error ? e.name : typeof e;

/**
 * Ejecuta la peticion y devuelve el cuerpo sin verificar.
 * `permitirRenovacion` corta la recursion: la propia llamada a /refresh no
 * puede intentar renovarse a si misma.
 */
async function ejecutar(
  ruta: string,
  opciones: OpcionesPeticion,
  permitirRenovacion: boolean,
): Promise<unknown> {
  const correlationId = nuevoCorrelationId();
  let respuesta = await enviar(ruta, opciones, correlationId);

  if (
    respuesta.estado === 401 &&
    permitirRenovacion &&
    !RUTAS_PUBLICAS.includes(ruta)
  ) {
    const token = await renovarAccessToken();
    if (token === null) {
      olvidarAccessToken();
      alPerderSesion();
      throw new ApiError(
        mensajeDelCuerpo(respuesta.cuerpo, "Sesion expirada"),
        401,
        "http",
        correlationId,
      );
    }
    respuesta = await enviar(ruta, opciones, correlationId);
  }

  if (!respuesta.ok) {
    if (respuesta.estado === 401) {
      olvidarAccessToken();
      alPerderSesion();
    }
    throw new ApiError(
      mensajeDelCuerpo(
        respuesta.cuerpo,
        "Ocurrio un error interno en el servidor",
      ),
      respuesta.estado,
      "http",
      correlationId,
    );
  }

  return respuesta.cuerpo;
}

/**
 * Peticion verificada.
 *
 * `verificar` no es opcional a proposito: sin guarda no hay forma de obtener un
 * valor tipado de esta funcion, asi que ningun dato de la red puede entrar al
 * estado de la aplicacion sin pasar la frontera de confianza (arquitectura §6).
 */
export async function pedir<T>(
  ruta: string,
  verificar: (crudo: unknown, ruta: string) => T,
  opciones: OpcionesPeticion = {},
): Promise<T> {
  const crudo = await ejecutar(ruta, opciones, true);
  try {
    return verificar(crudo, ruta);
  } catch (e) {
    const contrato = e instanceof ErrorDeContrato ? e : null;
    const campo = contrato?.ruta ?? "desconocido";

    // Al LOG solo van ruta y campo, nunca el valor recibido: puede ser PII.
    logger.error("Respuesta fuera de contrato", { ruta, campo });

    // En desarrollo el mensaje dice QUE campo se desvio, y para los conjuntos
    // cerrados tambien que llego y que se esperaba. Sin eso, un contrato que
    // cambia produce siempre el mismo texto opaco y hay que salir a adivinar.
    // En produccion no se revela nada: es informacion interna.
    const detalle = contrato?.detalle;
    throw new ApiError(
      import.meta.env.PROD
        ? "El servidor devolvio una respuesta inesperada."
        : `El servidor devolvio una respuesta inesperada. Campo fuera de contrato: "${campo}"` +
          (detalle === undefined ? "." : ` (${detalle}).`),
      0,
      "contrato",
    );
  }
}
