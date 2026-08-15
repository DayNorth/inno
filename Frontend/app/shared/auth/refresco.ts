/**
 * Rehidratacion de la sesion.
 *
 * El access token vive en memoria, asi que un F5 lo pierde. Al arrancar se
 * intenta UN refresh silencioso con la cookie httpOnly.
 *
 * IMPORTANTE: los loaders anidados de React Router corren EN PARALELO, no en
 * cascada. El del root no termina antes que los de sus hijos, asi que un guard
 * que solo mire `sesionActual()` decide antes de que exista la sesion y echa al
 * usuario en cada recarga. Por eso esto expone una promesa compartida que los
 * guards esperan explicitamente (`shared/auth/requerir.ts`), en vez de confiar
 * en un orden que el router no garantiza.
 */
import { renovarAccessToken } from "@/shared/api/cliente";
import { logger } from "@/shared/observabilidad/logger";
import { decodificarJwt } from "./decodificarJwt";
import { establecerSesion, sesionActual } from "./sesion";

/**
 * El intento en curso (o ya resuelto) de esta carga de pagina.
 *
 * Single-flight: N guards concurrentes esperan el MISMO refresh. Una vez
 * resuelto se conserva, de modo que un fallo no se reintenta en bucle: es el
 * "un solo intento" del diseno.
 */
let intento: Promise<boolean> | null = null;

async function intentarRehidratar(): Promise<boolean> {
  const token = await renovarAccessToken();
  if (token === null) {
    logger.debug("Sin sesion que rehidratar: el refresh no devolvio token");
    return false;
  }

  const claims = decodificarJwt(token);
  if (claims === null) {
    logger.warn("El refresh devolvio un token ilegible");
    return false;
  }

  establecerSesion(
    {
      id_usuario: claims.id_usuario,
      correo: claims.correo,
      id_rol: claims.id_rol,
      rol: claims.rol,
      // El refresh no devuelve `nombre` (contrato-api.md §1.2).
      nombre: null,
    },
    token,
  );
  return true;
}

/** Devuelve si hay sesion activa, esperando al refresh silencioso si hace falta. */
export function rehidratarSesion(): Promise<boolean> {
  if (sesionActual() !== null) return Promise.resolve(true);
  intento ??= intentarRehidratar();
  return intento;
}

/** Tras un login o un logout explicito se permite volver a rehidratar. */
export function permitirRehidratar(): void {
  intento = null;
}
