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
  readonly maxLength?: number | undefined;
  readonly filas?: number;
  readonly ayuda?: string;
  readonly disabled?: boolean;
}

/** Texto libre: aqui el corrector ortografico si ayuda (§9.2). */
export function CampoAreaTexto<T extends FieldValues, N extends FieldPath<T>>({
  control,
  name,
  etiqueta,
  reglas,
  maxLength,
  filas = 3,
  ayuda,
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
  const idAyuda = `${idCampo}-ayuda`;
  const obligatorio = reglas?.required !== undefined;
  const hayError = fieldState.error !== undefined;
  const descritoPor = cx(hayError && idError, ayuda !== undefined && idAyuda);

  return (
    <div className={cx("campo-vp", "campo-ancho-completo")} data-obligatorio={obligatorio ? "true" : "false"}>
      <label htmlFor={idCampo}>{etiqueta}</label>
      <textarea
        {...field}
        value={typeof field.value === "string" ? field.value : ""}
        id={idCampo}
        rows={filas}
        maxLength={maxLength}
        spellCheck
        disabled={disabled === true}
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
