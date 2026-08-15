import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { idDeCampo, usePrefijoCampo } from "./contextoFormulario";
import "./Campo.css";

interface Props<T extends FieldValues, N extends FieldPath<T>> {
  readonly control: Control<T>;
  readonly name: N;
  readonly etiqueta: string;
  readonly disabled?: boolean;
}

export function CampoCheckbox<T extends FieldValues, N extends FieldPath<T>>({
  control,
  name,
  etiqueta,
  disabled,
}: Props<T, N>) {
  const { field } = useController({ control, name });
  const idCampo = idDeCampo(usePrefijoCampo(), name);

  return (
    <div className="campo-checkbox">
      <input
        {...field}
        id={idCampo}
        type="checkbox"
        value={undefined}
        checked={field.value === true}
        disabled={disabled === true}
        onChange={(e) => {
          field.onChange(e.target.checked);
        }}
      />
      <label htmlFor={idCampo}>{etiqueta}</label>
    </div>
  );
}
