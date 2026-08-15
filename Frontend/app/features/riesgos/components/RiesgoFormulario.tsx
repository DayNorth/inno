import { useForm, useWatch } from "react-hook-form";
import { Alert } from "@/shared/ui/Alert/Alert";
import { Badge } from "@/shared/ui/Badge/Badge";
import { AccionesFormulario } from "@/shared/ui/campos/AccionesFormulario";
import { CampoAreaTexto } from "@/shared/ui/campos/CampoAreaTexto";
import { CampoNumero } from "@/shared/ui/campos/CampoNumero";
import { CampoTexto } from "@/shared/ui/campos/CampoTexto";
import { Formulario } from "@/shared/ui/campos/Formulario";
import { RejillaCampos } from "@/shared/ui/campos/RejillaCampos";
import { ResumenErrores } from "@/shared/ui/campos/ResumenErrores";
import {
  LARGOS_RIESGO,
  nivelDeCriticidad,
  type DatosRiesgo,
} from "../dominio/riesgo";
import {
  aPayloadRiesgo,
  reglasRiesgo,
  valoresInicialesRiesgo,
  type RiesgoForm,
} from "../formulario/reglas";

interface Props {
  readonly guardando: boolean;
  readonly errorServidor: string | null;
  readonly onGuardar: (datos: DatosRiesgo) => void;
  readonly onCancelar: () => void;
}

export function RiesgoFormulario({
  guardando,
  errorServidor,
  onGuardar,
  onCancelar,
}: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitted },
  } = useForm<RiesgoForm>({
    defaultValues: valoresInicialesRiesgo,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const probabilidad = useWatch({ control, name: "probabilidad" });
  const impacto = useWatch({ control, name: "impacto" });
  const producto =
    probabilidad !== null && impacto !== null ? probabilidad * impacto : null;

  return (
    <Formulario
      onSubmit={handleSubmit((f) => {
        onGuardar(aPayloadRiesgo(f));
      })}
    >
      {errorServidor !== null && <Alert tono="error">{errorServidor}</Alert>}
      <ResumenErrores errores={errors} visible={isSubmitted} />

      <RejillaCampos>
        <CampoTexto
          control={control}
          name="sistema"
          etiqueta="Sistema"
          reglas={reglasRiesgo.sistema}
          maxLength={LARGOS_RIESGO.sistema}
        />
        <CampoTexto
          control={control}
          name="categoria"
          etiqueta="Categoria"
          reglas={reglasRiesgo.categoria}
          maxLength={LARGOS_RIESGO.categoria}
        />
        <CampoNumero
          control={control}
          name="probabilidad"
          etiqueta="Probabilidad (1-5)"
          reglas={reglasRiesgo.probabilidad}
          min={1}
          max={5}
        />
        <CampoNumero
          control={control}
          name="impacto"
          etiqueta="Impacto (1-5)"
          reglas={reglasRiesgo.impacto}
          min={1}
          max={5}
        />
        <CampoAreaTexto
          control={control}
          name="descripcion"
          etiqueta="Descripcion"
          reglas={reglasRiesgo.descripcion}
          maxLength={LARGOS_RIESGO.descripcion}
        />
        <CampoAreaTexto
          control={control}
          name="control_mitigante"
          etiqueta="Control mitigante"
          reglas={reglasRiesgo.control_mitigante}
          maxLength={LARGOS_RIESGO.control_mitigante}
        />
      </RejillaCampos>

      {producto !== null && (
        <p>
          Criticidad prevista: <strong>{producto}</strong>{" "}
          <Badge tono={nivelDeCriticidad(producto).tono}>
            {nivelDeCriticidad(producto).etiqueta}
          </Badge>
        </p>
      )}

      <AccionesFormulario guardando={guardando} onCancelar={onCancelar} />
    </Formulario>
  );
}
