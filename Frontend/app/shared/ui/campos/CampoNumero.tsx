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

interface Props<T extends FieldValues, N extends FieldPath<T>> {
  readonly control: Control<T>;
  readonly name: N;
  readonly etiqueta: string;
  readonly reglas?: ReglasDeCampo<T, N> | undefined;
  readonly min?: number;
  readonly max?: number;
  readonly paso?: number | "any";
  readonly ayuda?: string;
  readonly disabled?: boolean;
  /** Oculta la etiqueta visualmente (filas de una tabla editable). */
  readonly etiquetaOculta?: boolean;
}

/**
 * La coercion a numero se hace aqui, no con `Number()` en el handler de envio.
 * El campo vacio vale `null`, no `NaN`: `NaN` se cuela por cualquier
 * comparacion y acaba viajando a la API como `null` sin que nadie lo note.
 */
export function CampoNumero<T extends FieldValues, N extends FieldPath<T>>({
  control,
  name,
  etiqueta,
  reglas,
  min,
  max,
  paso = 1,
  ayuda,
  disabled,
  etiquetaOculta,
}: Props<T, N>) {
  const { field, fieldState } = useController({
    control,
    name,
    ...(reglas === undefined ? {} : { rules: reglas }),
  });

  const prefijo = usePrefijoCampo();
  const idCampo = idDeCampo(prefijo, name);
  const idError = idDeError(prefijo, name);
  const idAyuda = `${idCampo}-ayuda`;
  const obligatorio = reglas?.required !== undefined;
  const hayError = fieldState.error !== undefined;
  const descritoPor = cx(hayError && idError, ayuda !== undefined && idAyuda);

  const valor =
    typeof field.value === "number" && Number.isFinite(field.value)
      ? String(field.value)
      : "";

  return (
    <div className="campo-vp" data-obligatorio={obligatorio ? "true" : "false"}>
      <label htmlFor={idCampo} className={etiquetaOculta === true ? "sr-only" : undefined}>
        {etiqueta}
      </label>
      <input
        {...field}
        id={idCampo}
        type="number"
        inputMode="decimal"
        value={valor}
        min={min}
        max={max}
        step={paso}
        disabled={disabled === true}
        onChange={(e) => {
          const bruto = e.target.value;
          field.onChange(bruto === "" ? null : Number(bruto));
        }}
        required={obligatorio}
        aria-required={obligatorio || undefined}
        aria-invalid={hayError || undefined}
        aria-describedby={descritoPor === "" ? undefined : descritoPor}
      />
      {ayuda !== undefined && (
        <p id={idAyuda} className="ayuda-campo">
          {ayuda}
        </p>
      )}
      {hayError && (
        <p id={idError} className="error-campo">
          {fieldState.error?.message}
        </p>
      )}
    </div>
  );
}
