import type { FieldValues, Path, RegisterOptions } from "react-hook-form";

/**
 * Mapa de reglas cuyas claves DEBEN ser campos reales de `T`.
 *
 * Es la pieza que sustituye al esquema: con `satisfies Reglas<MiForm>`, una
 * regla para un campo inexistente no compila, y `RegisterOptions` comprueba que
 * la regla sea valida para el tipo del campo.
 */
export type Reglas<T extends FieldValues> = {
  readonly [K in Path<T>]?: RegisterOptions<T, K>;
};

const esTextoVacio = (v: unknown): boolean =>
  v === null || v === undefined || (typeof v === "string" && v.trim() === "");

/** Obligatorio de verdad: rechaza tambien una cadena de solo espacios. */
export const obligatorio = (que: string) => ({
  required: `${que} es obligatorio`,
  validate: (v: unknown): string | true =>
    !esTextoVacio(v) || `${que} es obligatorio`,
});

/** Variante para sujetos femeninos ("La categoria es obligatoria"). */
export const obligatoria = (que: string) => ({
  required: `${que} es obligatoria`,
  validate: (v: unknown): string | true =>
    !esTextoVacio(v) || `${que} es obligatoria`,
});

/**
 * El tope viene de la columna SQL (contrato-api.md). El mismo numero alimenta
 * el `maxLength` del input, para que el navegador ni siquiera deje escribir de
 * mas, y la regla, que es la que produce el mensaje.
 */
export const largoMaximo = (max: number) => ({
  maxLength: { value: max, message: `Maximo ${max} caracteres` },
});

/** Un `<select>` sin elegir vale "" y debe fallar antes de llegar a la red. */
export const seleccionObligatoria = (que: string) => ({
  required: `Debe seleccionar ${que}`,
  validate: (v: unknown): string | true => {
    if (typeof v === "number") return v > 0 || `Debe seleccionar ${que}`;
    return !esTextoVacio(v) || `Debe seleccionar ${que}`;
  },
});

export const fechaObligatoria = (que: string) => ({
  required: `${que} es obligatoria`,
  validate: (v: unknown): string | true => {
    if (typeof v !== "string" || v === "") return `${que} es obligatoria`;
    return !Number.isNaN(new Date(v).getTime()) || `${que} no es valida`;
  },
});

export const fechaOpcional = (que: string) => ({
  validate: (v: unknown): string | true => {
    if (typeof v !== "string" || v === "") return true;
    return !Number.isNaN(new Date(v).getTime()) || `${que} no es valida`;
  },
});

/** Entero dentro de un rango cerrado, con el mensaje exacto del backend. */
export const enteroEntre = (minimo: number, maximo: number, mensaje: string) => ({
  required: mensaje,
  validate: (v: unknown): string | true => {
    if (typeof v !== "number" || !Number.isInteger(v)) return mensaje;
    return (v >= minimo && v <= maximo) || mensaje;
  },
});

export const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PATRON_TELEFONO = /^[\d\s+()-]*$/;

export const formatoCorreo = () => ({
  pattern: {
    value: PATRON_CORREO,
    message: "El correo no tiene un formato valido",
  },
});

export const formatoTelefono = () => ({
  pattern: {
    value: PATRON_TELEFONO,
    message: "El telefono solo admite digitos y + ( ) -",
  },
});

/** `""` -> `null`: el backend espera `null`, no cadena vacia (§13.4). */
export const opcional = (v: string | null | undefined): string | null => {
  if (v === null || v === undefined) return null;
  const limpio = v.trim();
  return limpio === "" ? null : limpio;
};

export const recortado = (v: string): string => v.trim();
