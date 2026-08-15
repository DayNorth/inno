import type { FieldErrors, FieldValues } from "react-hook-form";
import { idDeCampo, usePrefijoCampo } from "./contextoFormulario";

interface ErrorPlano {
  readonly ruta: string;
  readonly mensaje: string;
}

/**
 * Aplana el arbol de errores de RHF, incluidos los de `useFieldArray`
 * (`detalles.0.cantidad`), conservando la ruta para poder enlazar al campo.
 */
function aplanar(nodo: unknown, prefijo: string, salida: ErrorPlano[]): void {
  if (typeof nodo !== "object" || nodo === null) return;

  if ("message" in nodo && typeof nodo.message === "string") {
    const mensaje: string = nodo.message;
    if (mensaje !== "") {
      salida.push({ ruta: prefijo, mensaje });
      return;
    }
  }

  for (const [clave, valor] of Object.entries(nodo as Record<string, unknown>)) {
    if (clave === "ref" || clave === "type" || clave === "types") continue;
    aplanar(valor, prefijo === "" ? clave : `${prefijo}.${clave}`, salida);
  }
}

interface Props<T extends FieldValues> {
  readonly errores: FieldErrors<T>;
  /** Se renderiza solo tras el primer intento de envio. */
  readonly visible: boolean;
}

/**
 * Lista de todos los errores del formulario (WCAG 3.3.1).
 *
 * Es imprescindible aqui porque el backend devuelve UN SOLO mensaje por
 * respuesta (contrato-api.md §12): la validacion en cliente es la unica capaz
 * de mostrar todos los errores a la vez.
 */
export function ResumenErrores<T extends FieldValues>({ errores, visible }: Props<T>) {
  const prefijo = usePrefijoCampo();
  const planos: ErrorPlano[] = [];
  aplanar(errores, "", planos);

  if (!visible || planos.length === 0) return null;

  return (
    <div className="rounded-md border border-bad bg-bad-suave px-4 py-3 text-sm" role="alert">
      <p className="mb-2 font-semibold">
        {planos.length === 1
          ? "Revisa 1 campo antes de continuar"
          : `Revisa ${planos.length} campos antes de continuar`}
      </p>
      <ul className="m-0 flex flex-col gap-1 pl-6">
        {planos.map((e) => (
          <li key={e.ruta}>
            <a className="text-bad" href={`#${idDeCampo(prefijo, e.ruta)}`}>
              {e.mensaje}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
