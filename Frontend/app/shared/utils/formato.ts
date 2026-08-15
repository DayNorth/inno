const SOLO_FECHA = new Intl.DateTimeFormat("es-CR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const FECHA_HORA = new Intl.DateTimeFormat("es-CR", {
  dateStyle: "short",
  timeStyle: "short",
});

const MONEDA = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const ENTERO = new Intl.NumberFormat("es-CR", { maximumFractionDigits: 0 });

export const SIN_DATO = "—";

/**
 * Formatea una columna SQL `date`.
 *
 * Se parsea a MEDIODIA UTC a proposito: `new Date("2026-07-16")` es medianoche
 * UTC, y renderizado en es-CR (UTC-6) retrocede un dia. Ese era el bug D-C de
 * frontend-ui.md: las fechas se mostraban un dia antes de la almacenada.
 */
export function formatearFecha(iso: string | null | undefined): string {
  if (iso === null || iso === undefined || iso === "") return SIN_DATO;
  const soloFecha = iso.slice(0, 10);
  const f = new Date(`${soloFecha}T12:00:00Z`);
  return Number.isNaN(f.getTime()) ? SIN_DATO : SOLO_FECHA.format(f);
}

/** Formatea una columna SQL `datetime`, donde la hora si es un dato real. */
export function formatearFechaHora(iso: string | null | undefined): string {
  if (iso === null || iso === undefined || iso === "") return SIN_DATO;
  const f = new Date(iso);
  return Number.isNaN(f.getTime()) ? SIN_DATO : FECHA_HORA.format(f);
}

export function hoyIso(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

export function formatearMoneda(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return SIN_DATO;
  return MONEDA.format(n);
}

export function formatearEntero(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return SIN_DATO;
  return ENTERO.format(n);
}

export const oGuion = (v: string | null | undefined): string =>
  v === null || v === undefined || v.trim() === "" ? SIN_DATO : v;
