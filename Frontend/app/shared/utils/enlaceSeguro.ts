const ESQUEMAS_SEGUROS: ReadonlySet<string> = new Set([
  "http:",
  "https:",
  "mailto:",
]);

/**
 * Normaliza una URL que viene de datos antes de interpolarla en `href`/`src`.
 *
 * Un campo de texto del backend puede contener `javascript:`, que seria
 * ejecutable al pulsarlo. Hoy no ocurre; esto lo convierte en invariante.
 */
export function enlaceSeguro(bruto: string | null | undefined): string | null {
  if (bruto === null || bruto === undefined || bruto.trim() === "") return null;
  try {
    const url = new URL(bruto, window.location.origin);
    return ESQUEMAS_SEGUROS.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

/** `mailto:` seguro para una columna de correo del contrato. */
export function enlaceCorreo(correo: string | null): string | null {
  if (correo === null || correo.trim() === "") return null;
  return enlaceSeguro(`mailto:${correo.trim()}`);
}
