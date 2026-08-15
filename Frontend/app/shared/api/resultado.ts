import { mensajeDeError } from "./ApiError";

/**
 * Resultado de un `clientAction`.
 *
 * El error del servidor se devuelve como DATO, no se lanza: la pagina lo pinta
 * en su `Alert` sin romper la navegacion ni perder lo que el usuario escribio.
 */
export type ResultadoAccion =
  | { readonly ok: true; readonly mensaje: string }
  | { readonly ok: false; readonly mensaje: string };

export const exito = (mensaje: string): ResultadoAccion => ({
  ok: true,
  mensaje,
});

export const fallo = (e: unknown): ResultadoAccion => ({
  ok: false,
  mensaje: mensajeDeError(e),
});

/** Envuelve una operacion de escritura con el manejo de error estandar. */
export async function ejecutarAccion(
  operacion: () => Promise<string>,
): Promise<ResultadoAccion> {
  try {
    return exito(await operacion());
  } catch (e) {
    return fallo(e);
  }
}
