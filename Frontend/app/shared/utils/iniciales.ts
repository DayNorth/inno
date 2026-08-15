/**
 * Iniciales para el avatar del usuario. Nunca se pide ni se muestra una foto:
 * el contrato no expone una, y traerla de un servicio externo violaria la CSP
 * (img-src 'self' data:, frontend-seguridad.md §3.3).
 */
export function iniciales(nombre: string | null, correo: string): string {
  const base = nombre ?? correo;
  const partes = base.trim().split(/\s+/).filter((p) => p !== "");
  const primera = partes[0]?.[0] ?? "";
  const segunda = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? "") : "";
  const resultado = (primera + segunda).toUpperCase();
  return resultado !== "" ? resultado : "?";
}
