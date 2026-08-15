/**
 * Logger con depuracion de PII (frontend-seguridad.md §7.1).
 *
 * No basta con pedir a quien llama que no pase datos sensibles: se eliminan
 * en el propio logger, antes de emitir.
 */

export type Contexto = Readonly<Record<string, unknown>>;

const CLAVES_VETADAS: ReadonlySet<string> = new Set([
  "token",
  "accesstoken",
  "refreshtoken",
  "authorization",
  "cookie",
  "password",
  "contrasena",
  "correo",
  "telefono",
  "email",
  "usuario",
  "nombre",
]);

const OMITIDO = "[omitido]";

function depurar(contexto: Contexto): Record<string, unknown> {
  const limpio: Record<string, unknown> = {};
  for (const [clave, valor] of Object.entries(contexto)) {
    limpio[clave] = CLAVES_VETADAS.has(clave.toLowerCase()) ? OMITIDO : valor;
  }
  return limpio;
}

const esProduccion = (): boolean => import.meta.env.PROD;

export const logger = {
  debug(mensaje: string, contexto: Contexto = {}): void {
    if (esProduccion()) return;
    console.debug(`[vinkaplant] ${mensaje}`, depurar(contexto));
  },
  info(mensaje: string, contexto: Contexto = {}): void {
    if (esProduccion()) return;
    console.info(`[vinkaplant] ${mensaje}`, depurar(contexto));
  },
  warn(mensaje: string, contexto: Contexto = {}): void {
    console.warn(`[vinkaplant] ${mensaje}`, depurar(contexto));
  },
  error(mensaje: string, contexto: Contexto = {}): void {
    console.error(`[vinkaplant] ${mensaje}`, depurar(contexto));
  },
};

/** Expuesto solo para los tests de §10 de frontend-seguridad.md. */
export const _clavesVetadas = CLAVES_VETADAS;
