/**
 * Primitivas de verificacion de la frontera de confianza.
 *
 * Sustituyen a zod (restriccion del proyecto). Son deliberadamente explicitas:
 * en un proyecto de seguridad, defender 70 lineas legibles es mas facil que
 * defender por que se confia en un paquete de terceros para el control de
 * frontera.
 *
 * Propiedad favorable (frontend-seguridad.md §3.6): las guardas construyen
 * objetos NUEVOS campo a campo. Una respuesta con clave `__proto__` no llega a
 * ningun prototipo porque esa clave sencillamente no se lee. Un spread generico
 * si tendria esa superficie: no "optimizar" las guardas en esa direccion.
 */

export class ErrorDeContrato extends Error {
  readonly ruta: string;
  /**
   * Detalle diagnostico, SOLO para conjuntos cerrados (`literal`): ahi el valor
   * es una etiqueta de un enum, nunca texto libre ni PII. El resto de guardas
   * lo dejan vacio a proposito, y el logger no lo emite en ningun caso
   * (frontend-seguridad.md §7.1).
   */
  readonly detalle: string | undefined;

  constructor(ruta: string, detalle?: string) {
    super(`Respuesta fuera de contrato en "${ruta}"`);
    this.name = "ErrorDeContrato";
    this.ruta = ruta;
    this.detalle = detalle;
  }
}

const esObjeto = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export function objeto(v: unknown, ruta: string): Record<string, unknown> {
  if (!esObjeto(v)) throw new ErrorDeContrato(ruta);
  return v;
}

export function texto(v: unknown, ruta: string): string {
  if (typeof v !== "string") throw new ErrorDeContrato(ruta);
  return v;
}

export function textoNulable(v: unknown, ruta: string): string | null {
  if (v === null || v === undefined) return null;
  return texto(v, ruta);
}

export function entero(v: unknown, ruta: string): number {
  if (typeof v !== "number" || !Number.isInteger(v)) {
    throw new ErrorDeContrato(ruta);
  }
  return v;
}

export function enteroNulable(v: unknown, ruta: string): number | null {
  if (v === null || v === undefined) return null;
  return entero(v, ruta);
}

/**
 * Numero finito. Acepta tambien la forma string porque el driver `mssql` puede
 * devolver `decimal` como texto segun configuracion (contrato-api.md §1.6).
 */
export function numero(v: unknown, ruta: string): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  throw new ErrorDeContrato(ruta);
}

export function numeroNulable(v: unknown, ruta: string): number | null {
  if (v === null || v === undefined) return null;
  return numero(v, ruta);
}

/** `bit` de SQL Server. El driver puede devolver 0/1 en vez de booleano. */
export function booleano(v: unknown, ruta: string): boolean {
  if (typeof v === "boolean") return v;
  if (v === 0 || v === 1) return v === 1;
  throw new ErrorDeContrato(ruta);
}

/** Valida contra un conjunto cerrado y estrecha el tipo a la union literal. */
export function literal<const U extends readonly string[]>(
  v: unknown,
  permitidos: U,
  ruta: string,
): U[number] {
  const s = texto(v, ruta);
  if (!permitidos.includes(s)) {
    throw new ErrorDeContrato(
      ruta,
      `recibido ${JSON.stringify(s)}; se esperaba ${permitidos
        .map((p) => JSON.stringify(p))
        .join(" | ")}`,
    );
  }
  return s;
}

export function literalNulable<const U extends readonly string[]>(
  v: unknown,
  permitidos: U,
  ruta: string,
): U[number] | null {
  if (v === null || v === undefined) return null;
  return literal(v, permitidos, ruta);
}

/** Fecha ISO. No se convierte a `Date`: se conserva el string del contrato. */
export function fechaIso(v: unknown, ruta: string): string {
  const s = texto(v, ruta);
  if (Number.isNaN(new Date(s).getTime())) throw new ErrorDeContrato(ruta);
  return s;
}

export function fechaIsoNulable(v: unknown, ruta: string): string | null {
  if (v === null || v === undefined) return null;
  return fechaIso(v, ruta);
}

export function lista<T>(
  v: unknown,
  ruta: string,
  item: (x: unknown, r: string) => T,
): T[] {
  if (!Array.isArray(v)) throw new ErrorDeContrato(ruta);
  return v.map((x: unknown, i) => item(x, `${ruta}[${i}]`));
}

/** Para respuestas de escritura cuyo unico contenido util es `{ mensaje }`. */
export function mensaje(v: unknown, ruta: string): string {
  const o = objeto(v, ruta);
  return texto(o.mensaje, `${ruta}.mensaje`);
}
