/**
 * Cache con TTL para catalogos (arquitectura §4.3).
 *
 * Los loaders de React Router no cachean: cada navegacion a /pedidos recargaria
 * clientes y productos. Para los catalogos que se repiten entre rutas eso es
 * gratuito de evitar.
 */

interface Entrada<T> {
  readonly valor: T;
  readonly expira: number;
}

const memoria = new Map<string, Entrada<unknown>>();

/** TTL por defecto de un catalogo: cambian poco dentro de una sesion. */
export const TTL_CATALOGO_MS = 5 * 60_000;

/** Memoriza el resultado de `cargar` durante `ttlMs`. */
export async function conCache<T>(
  clave: string,
  ttlMs: number,
  cargar: () => Promise<T>,
): Promise<T> {
  const guardada = memoria.get(clave);
  if (guardada !== undefined && guardada.expira > Date.now()) {
    return guardada.valor as T;
  }
  const valor = await cargar();
  memoria.set(clave, { valor, expira: Date.now() + ttlMs });
  return valor;
}

/**
 * Se llama en el logout y al recibir un cierre de otra pestana.
 * No es opcional: ningun dato de una sesion puede sobrevivir a la siguiente.
 */
export function limpiarCache(): void {
  memoria.clear();
}
