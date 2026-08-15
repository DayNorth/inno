import { useForm } from "react-hook-form";
import { Alert } from "@/shared/ui/Alert/Alert";
import { AccionesFormulario } from "@/shared/ui/campos/AccionesFormulario";
import { Formulario } from "@/shared/ui/campos/Formulario";
import type { CriteriosEvaluacion } from "../dominio/proveedor";
import {
  valoresInicialesEvaluacion,
  type EvaluacionForm,
} from "../formulario/reglas";
import { CriteriosEvaluacionCampos } from "./CriteriosEvaluacionCampos";

interface Props {
  readonly guardando: boolean;
  readonly errorServidor: string | null;
  readonly onGuardar: (criterios: CriteriosEvaluacion) => void;
}

export function EvaluacionFormulario({
  guardando,
  errorServidor,
  onGuardar,
}: Props) {
  const { control, handleSubmit } = useForm<EvaluacionForm>({
    defaultValues: valoresInicialesEvaluacion,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  return (
    <Formulario
      onSubmit={handleSubmit((f) => {
        onGuardar(f);
      })}
    >
      {errorServidor !== null && <Alert tono="error">{errorServidor}</Alert>}
      <CriteriosEvaluacionCampos control={control} />
      <AccionesFormulario guardando={guardando} textoGuardar="Registrar evaluacion" />
    </Formulario>
  );
}
