import { useForm } from "react-hook-form";
import { Alert } from "@/shared/ui/Alert/Alert";
import { AccionesFormulario } from "@/shared/ui/campos/AccionesFormulario";
import { CampoTexto } from "@/shared/ui/campos/CampoTexto";
import { Formulario } from "@/shared/ui/campos/Formulario";
import { RejillaCampos } from "@/shared/ui/campos/RejillaCampos";
import { ResumenErrores } from "@/shared/ui/campos/ResumenErrores";
import { LARGOS_PROVEEDOR, type DatosProveedor } from "../dominio/proveedor";
import {
  aPayloadProveedor,
  reglasProveedor,
  valoresInicialesProveedor,
  type ProveedorForm,
} from "../formulario/reglas";
import { CriteriosEvaluacionCampos } from "./CriteriosEvaluacionCampos";

interface Props {
  readonly guardando: boolean;
  readonly errorServidor: string | null;
  readonly onGuardar: (datos: DatosProveedor) => void;
  readonly onCancelar: () => void;
}

export function ProveedorFormulario({
  guardando,
  errorServidor,
  onGuardar,
  onCancelar,
}: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitted },
  } = useForm<ProveedorForm>({
    defaultValues: valoresInicialesProveedor,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  return (
    <Formulario
      onSubmit={handleSubmit((f) => {
        onGuardar(aPayloadProveedor(f));
      })}
    >
      {errorServidor !== null && <Alert tono="error">{errorServidor}</Alert>}
      <ResumenErrores errores={errors} visible={isSubmitted} />

      <RejillaCampos>
        <CampoTexto
          control={control}
          name="nombre_proveedor"
          etiqueta="Proveedor"
          reglas={reglasProveedor.nombre_proveedor}
          maxLength={LARGOS_PROVEEDOR.nombre_proveedor}
        />
        <CampoTexto
          control={control}
          name="tipo_servicio"
          etiqueta="Tipo de servicio"
          reglas={reglasProveedor.tipo_servicio}
          maxLength={LARGOS_PROVEEDOR.tipo_servicio}
        />
      </RejillaCampos>

      <CriteriosEvaluacionCampos control={control} />

      <AccionesFormulario
        guardando={guardando}
        textoGuardar="Evaluar y registrar"
        onCancelar={onCancelar}
      />
    </Formulario>
  );
}
