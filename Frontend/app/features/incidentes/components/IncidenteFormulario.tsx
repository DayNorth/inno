import { useForm } from "react-hook-form";
import { Alert } from "@/shared/ui/Alert/Alert";
import { AccionesFormulario } from "@/shared/ui/campos/AccionesFormulario";
import { CampoAreaTexto } from "@/shared/ui/campos/CampoAreaTexto";
import { CampoSelect, type OpcionSelect } from "@/shared/ui/campos/CampoSelect";
import { CampoTexto } from "@/shared/ui/campos/CampoTexto";
import { Formulario } from "@/shared/ui/campos/Formulario";
import { RejillaCampos } from "@/shared/ui/campos/RejillaCampos";
import { ResumenErrores } from "@/shared/ui/campos/ResumenErrores";
import { LARGOS_INCIDENTE, type DatosIncidente } from "../dominio/incidente";
import {
  aPayloadIncidente,
  reglasIncidente,
  valoresInicialesIncidente,
  type IncidenteForm,
} from "../formulario/reglas";

interface Props {
  readonly plataformas: readonly OpcionSelect[];
  readonly responsables: readonly OpcionSelect[];
  readonly guardando: boolean;
  readonly errorServidor: string | null;
  readonly onGuardar: (datos: DatosIncidente) => void;
  readonly onCancelar: () => void;
}

export function IncidenteFormulario({
  plataformas,
  responsables,
  guardando,
  errorServidor,
  onGuardar,
  onCancelar,
}: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitted },
  } = useForm<IncidenteForm>({
    defaultValues: valoresInicialesIncidente(),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  return (
    <Formulario
      onSubmit={handleSubmit((f) => {
        onGuardar(aPayloadIncidente(f));
      })}
    >
      {errorServidor !== null && <Alert tono="error">{errorServidor}</Alert>}
      <ResumenErrores errores={errors} visible={isSubmitted} />

      <RejillaCampos>
        <CampoTexto
          control={control}
          name="titulo"
          etiqueta="Titulo"
          reglas={reglasIncidente.titulo}
          maxLength={LARGOS_INCIDENTE.titulo}
          anchoCompleto
        />
        <CampoSelect
          control={control}
          name="id_plataforma"
          etiqueta="Plataforma"
          opciones={plataformas}
          reglas={reglasIncidente.id_plataforma}
          numerico
        />
        <CampoSelect
          control={control}
          name="id_usuario_responsable"
          etiqueta="Responsable"
          opciones={responsables}
          reglas={reglasIncidente.id_usuario_responsable}
          numerico
        />
        <CampoTexto
          control={control}
          name="fecha_inicio"
          etiqueta="Fecha de inicio"
          type="date"
          reglas={reglasIncidente.fecha_inicio}
        />
        <CampoAreaTexto
          control={control}
          name="procedimiento_alterno"
          etiqueta="Procedimiento alterno"
          reglas={reglasIncidente.procedimiento_alterno}
          maxLength={LARGOS_INCIDENTE.procedimiento_alterno}
        />
      </RejillaCampos>

      <AccionesFormulario
        guardando={guardando}
        textoGuardar="Reportar"
        onCancelar={onCancelar}
      />
    </Formulario>
  );
}
