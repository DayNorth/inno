import { useForm } from "react-hook-form";
import { Alert } from "@/shared/ui/Alert/Alert";
import { AccionesFormulario } from "@/shared/ui/campos/AccionesFormulario";
import { CampoAreaTexto } from "@/shared/ui/campos/CampoAreaTexto";
import { CampoTexto } from "@/shared/ui/campos/CampoTexto";
import { Formulario } from "@/shared/ui/campos/Formulario";
import { RejillaCampos } from "@/shared/ui/campos/RejillaCampos";
import { ResumenErrores } from "@/shared/ui/campos/ResumenErrores";
import { LARGOS_PROVEEDOR, type DatosPlan } from "../dominio/proveedor";
import {
  aPayloadPlan,
  reglasPlan,
  valoresInicialesPlan,
  type PlanForm,
} from "../formulario/reglas";

interface Props {
  readonly guardando: boolean;
  readonly errorServidor: string | null;
  readonly onGuardar: (datos: DatosPlan) => void;
}

export function PlanFormulario({ guardando, errorServidor, onGuardar }: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitted },
  } = useForm<PlanForm>({
    defaultValues: valoresInicialesPlan,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  return (
    <Formulario
      onSubmit={handleSubmit((f) => {
        onGuardar(aPayloadPlan(f));
      })}
    >
      {errorServidor !== null && <Alert tono="error">{errorServidor}</Alert>}
      <ResumenErrores errores={errors} visible={isSubmitted} />

      <RejillaCampos>
        <CampoTexto
          control={control}
          name="escenario"
          etiqueta="Escenario"
          reglas={reglasPlan.escenario}
          maxLength={LARGOS_PROVEEDOR.escenario}
          anchoCompleto
        />
        <CampoTexto
          control={control}
          name="responsable"
          etiqueta="Responsable"
          reglas={reglasPlan.responsable}
          maxLength={LARGOS_PROVEEDOR.responsable}
        />
        <CampoAreaTexto
          control={control}
          name="procedimiento_alterno"
          etiqueta="Procedimiento alterno"
          reglas={reglasPlan.procedimiento_alterno}
          maxLength={LARGOS_PROVEEDOR.procedimiento_alterno}
          filas={4}
        />
      </RejillaCampos>

      <AccionesFormulario guardando={guardando} textoGuardar="Registrar plan" />
    </Formulario>
  );
}
