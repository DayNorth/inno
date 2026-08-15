/**
 * Identificador de correlacion por peticion.
 *
 * Viaja en `X-Correlation-Id` (header permitido por el CORS del backend,
 * contrato-api.md §1.1) y es lo unico que se muestra al usuario cuando algo
 * falla: es opaco, no lleva PII, y permite cruzar con el log del servidor.
 */

const HEX = "0123456789abcdef";

function aleatorioDeRespaldo(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let salida = "";
  for (const b of bytes) {
    salida += HEX[(b >> 4) & 0x0f] ?? "0";
    salida += HEX[b & 0x0f] ?? "0";
  }
  return salida;
}

export function nuevoCorrelationId(): string {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : aleatorioDeRespaldo();
}

export const CABECERA_CORRELACION = "X-Correlation-Id";
