import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from "react-hook-form";
import { cx } from "@/shared/utils/cx";
import { idDeCampo, idDeError, usePrefijoCampo } from "./contextoFormulario";
import "./Campo.css";

/** `useController` no admite las opciones de coercion de `register`. */
export type ReglasDeCampo<T extends FieldValues, N extends FieldPath<T>> = Omit<
  RegisterOptions<T, N>,
  "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
>;

export type TipoTexto = "text" | "email" | "password" | "date" | "tel" | "url";

interface Props<T extends FieldValues, N extends FieldPath<T>> {
  readonly control: Control<T>;
  /** Solo campos REALES de T: un typo no compila. */
  readonly name: N;
  readonly etiqueta: string;
  readonly reglas?: ReglasDeCampo<T, N> | undefined;
  readonly maxLength?: number | undefined;
  readonly type?: TipoTexto;
  readonly autoComplete?: string;
  /**
   * Varios navegadores con correccion mejorada envian el contenido del campo a
   * un servicio remoto: en identificadores y credenciales va desactivado
   * (frontend-seguridad.md §9.2).
   */
  readonly spellCheck?: boolean;
  readonly ayuda?: string;
  readonly anchoCompleto?: boolean;
  readonly disabled?: boolean;
}

export function CampoTexto<T extends FieldValues, N extends FieldPath<T>>({
  control,
  name,
  etiqueta,
  reglas,
  maxLength,
  type = "text",
  autoComplete = "off",
  spellCheck = false,
  ayuda,
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
  const idAyuda = `${idCampo}-ayuda`;
  const obligatorio = reglas?.required !== undefined;
  const hayError = fieldState.error !== undefined;

  const descritoPor = cx(hayError && idError, ayuda !== undefined && idAyuda);

  return (
    <div
      className={cx("campo-vp", anchoCompleto === true && "campo-ancho-completo")}
      data-obligatorio={obligatorio ? "true" : "false"}
    >
      <label htmlFor={idCampo}>{etiqueta}</label>
      <input
        {...field}
        value={typeof field.value === "string" ? field.value : ""}
        id={idCampo}
        type={type}
        maxLength={maxLength}
        autoComplete={autoComplete}
        spellCheck={spellCheck}
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
