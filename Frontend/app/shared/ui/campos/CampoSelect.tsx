import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { cx } from "@/shared/utils/cx";
import type { ReglasDeCampo } from "./CampoTexto";
import { idDeCampo, idDeError, usePrefijoCampo } from "./contextoFormulario";
import "./Campo.css";

export interface OpcionSelect {
  readonly valor: string | number;
  readonly etiqueta: string;
}

interface Props<T extends FieldValues, N extends FieldPath<T>> {
  readonly control: Control<T>;
  readonly name: N;
  readonly etiqueta: string;
  readonly opciones: readonly OpcionSelect[];
  readonly reglas?: ReglasDeCampo<T, N> | undefined;
  /**
   * Texto de la opcion vacia. `null` la suprime, que es lo correcto cuando el
   * campo SIEMPRE tiene valor (p. ej. el estado de un pedido, que arranca en
   * "Pendiente"): una opcion vacia ahi solo duplica una etiqueta y permite
   * enviar "" a un campo de conjunto cerrado.
   */
  readonly placeholder?: string | null;
  /** Los `id_*` del contrato son numeros: se convierten al salir del control. */
  readonly numerico?: boolean;
  readonly anchoCompleto?: boolean;
  readonly disabled?: boolean;
}

export function CampoSelect<T extends FieldValues, N extends FieldPath<T>>({
  control,
  name,
  etiqueta,
  opciones,
  reglas,
  placeholder = "Seleccione…",
  numerico = false,
  anchoCompleto,
  disabled,
}: Props<T, N>) {
  const { field, fieldState } = useController({
    control,
    name,
    ...(reglas === undefined ? {} : { rules: reglas }),
  });

  const prefijo = usePrefijoCampo();
  const idCampo = idDeCampo(prefijo, name);
  const idError = idDeError(prefijo, name);
  const obligatorio = reglas?.required !== undefined;
  const hayError = fieldState.error !== undefined;

  const valor =
    field.value === null || field.value === undefined ? "" : String(field.value);

  return (
    <div
      className={cx("campo-vp", anchoCompleto === true && "campo-ancho-completo")}
      data-obligatorio={obligatorio ? "true" : "false"}
    >
      <label htmlFor={idCampo}>{etiqueta}</label>
      <select
        {...field}
        id={idCampo}
        value={valor}
        onChange={(e) => {
          const bruto = e.target.value;
          field.onChange(
            numerico ? (bruto === "" ? null : Number(bruto)) : bruto,
          );
        }}
        disabled={disabled === true}
        required={obligatorio}
        aria-required={obligatorio || undefined}
        aria-invalid={hayError || undefined}
        aria-describedby={hayError ? idError : undefined}
      >
        {placeholder !== null && <option value="">{placeholder}</option>}
        {opciones.map((o) => (
          <option key={String(o.valor)} value={String(o.valor)}>
            {o.etiqueta}
          </option>
        ))}
      </select>
      {hayError && (
        <p id={idError} className="error-campo">
          {fieldState.error?.message}
        </p>
      )}
    </div>
  );
}
