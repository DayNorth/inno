import { createContext, useContext } from "react";

/**
 * Prefijo de los `id` de un formulario.
 *
 * Sin el, dos formularios en la misma pantalla (p. ej. el detalle de proveedor,
 * con "nueva evaluacion" y "nuevo plan") generarian `id="campo-escenario"`
 * duplicados y los `htmlFor` apuntarian al control equivocado.
 */
export const ContextoFormulario = createContext<string>("form");

export const usePrefijoCampo = (): string => useContext(ContextoFormulario);

export const idDeCampo = (prefijo: string, nombre: string): string =>
  `${prefijo}-campo-${nombre}`;

export const idDeError = (prefijo: string, nombre: string): string =>
  `${prefijo}-error-${nombre}`;
