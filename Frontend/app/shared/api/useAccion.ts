import { useCallback, useState } from "react";
import { useFetcher } from "react-router";
import { enviarJson } from "./enviarJson";
import type { ResultadoAccion } from "./resultado";

/** Lo que devuelve `fetcher.data` para un `clientAction` que responde `R`. */
type DatosDeFetcher<R> = ReturnType<typeof useFetcher<R>>["data"];

export interface Accion<R extends ResultadoAccion> {
  readonly enviar: (cuerpo: object) => void;
  /** Descarta el resultado anterior. Se llama al abrir un dialogo. */
  readonly reiniciar: () => void;
  readonly ocupado: boolean;
  readonly resultado: DatosDeFetcher<R>;
  readonly exito: boolean;
  readonly error: string | null;
}

/**
 * Envoltorio de `useFetcher` para las escrituras de una pantalla.
 *
 * La `clave` cambia en cada `reiniciar()`, lo que da un fetcher nuevo y sin
 * datos. Gracias a eso, "cerrar el dialogo cuando la escritura salio bien" se
 * DERIVA del resultado en vez de necesitar un `useEffect` con `setState`, que
 * provoca renders en cascada.
 */
export function useAccion<R extends ResultadoAccion = ResultadoAccion>(
  nombre: string,
): Accion<R> {
  const [generacion, setGeneracion] = useState(0);
  const fetcher = useFetcher<R>({ key: `${nombre}-${generacion}` });
  const { submit, data, state } = fetcher;

  const reiniciar = useCallback(() => {
    setGeneracion((g) => g + 1);
  }, []);

  const enviar = useCallback(
    (cuerpo: object) => {
      enviarJson(submit, cuerpo);
    },
    [submit],
  );

  return {
    enviar,
    reiniciar,
    ocupado: state !== "idle",
    resultado: data,
    exito: data?.ok === true,
    error: data !== undefined && !data.ok ? data.mensaje : null,
  };
}
