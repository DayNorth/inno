/**
 * Une clases de CSS Modules descartando lo vacio.
 *
 * Existe porque con `noUncheckedIndexedAccess` el acceso a un modulo CSS es
 * `string | undefined`, y una interpolacion directa produciria la clase
 * literal "undefined".
 */
export function cx(
  ...partes: readonly (string | false | null | undefined)[]
): string {
  return partes.filter((p): p is string => typeof p === "string" && p !== "").join(" ");
}
