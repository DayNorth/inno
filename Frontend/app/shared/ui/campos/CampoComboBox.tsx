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
  /** Valores ya usados. Sugieren, no limitan. */
  readonly sugerencias: readonly string[];
  readonly reglas?: ReglasDeCampo<T, N> | undefined;
  readonly maxLength?: number | undefined;
  readonly ayuda?: string;
  readonly anchoCompleto?: boolean;
  readonly disabled?: boolean;
}

/**
 * Campo de texto con sugerencias (`<input list>` + `<datalist>`).
 *
 * Se usa donde el contrato define texto libre pero en la practica el valor se
 * repite: ofrece los valores ya existentes sin cerrar el conjunto. Un `<select>`
 * seria mentira aqui —impediria registrar un valor nuevo, incluido el primero—
 * y el backend seguiria aceptando cualquier cadena.
 *
 * `<datalist>` es el combobox nativo: sin dependencias, con teclado y lector de
 * pantalla ya resueltos por el navegador.
 */
export function CampoComboBox<T extends FieldValues, N extends FieldPath<T>>({
  control,
  name,
  etiqueta,
  sugerencias,
  reglas,
  maxLength,
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
  const idLista = `${idCampo}-sugerencias`;
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
        type="text"
        list={sugerencias.length > 0 ? idLista : undefined}
        maxLength={maxLength}
        autoComplete="off"
        spellCheck={false}
        disabled={disabled === true}
        required={obligatorio}
        aria-required={obligatorio || undefined}
        aria-invalid={hayError || undefined}
        aria-describedby={descritoPor === "" ? undefined : descritoPor}
      />
      {sugerencias.length > 0 && (
        <datalist id={idLista}>
          {sugerencias.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
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
