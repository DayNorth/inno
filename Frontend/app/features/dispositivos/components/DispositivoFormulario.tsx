import { useForm, useWatch } from "react-hook-form";
import type { OpcionSelect } from "@/shared/ui/campos/CampoSelect";
import { Alert } from "@/shared/ui/Alert/Alert";
import { Badge } from "@/shared/ui/Badge/Badge";
import { AccionesFormulario } from "@/shared/ui/campos/AccionesFormulario";
import { CampoCheckbox } from "@/shared/ui/campos/CampoCheckbox";
import { CampoSelect } from "@/shared/ui/campos/CampoSelect";
import { CampoTexto } from "@/shared/ui/campos/CampoTexto";
import { Formulario } from "@/shared/ui/campos/Formulario";
import { RejillaCampos } from "@/shared/ui/campos/RejillaCampos";
import { ResumenErrores } from "@/shared/ui/campos/ResumenErrores";
import {
  estadoSeguridadPrevisto,
  LARGOS_DISPOSITIVO,
  type DatosDispositivo,
} from "../dominio/dispositivo";
import {
  aPayloadDispositivo,
  reglasDispositivo,
  valoresInicialesDispositivo,
  type DispositivoForm,
} from "../formulario/reglas";

interface Props {
  readonly responsables: readonly OpcionSelect[];
  readonly guardando: boolean;
  readonly errorServidor: string | null;
  readonly onGuardar: (datos: DatosDispositivo) => void;
  readonly onCancelar: () => void;
}

export function DispositivoFormulario({
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
  } = useForm<DispositivoForm>({
    defaultValues: valoresInicialesDispositivo,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const antivirus = useWatch({ control, name: "antivirus_activo" });
  const ups = useWatch({ control, name: "tiene_ups" });
  const previsto = estadoSeguridadPrevisto(antivirus, ups);

  return (
    <Formulario
      onSubmit={handleSubmit((f) => {
        onGuardar(aPayloadDispositivo(f));
      })}
    >
      {errorServidor !== null && <Alert tono="error">{errorServidor}</Alert>}
      <ResumenErrores errores={errors} visible={isSubmitted} />

      <RejillaCampos>
        <CampoSelect
          control={control}
          name="id_usuario"
          etiqueta="Responsable"
          opciones={responsables}
          reglas={reglasDispositivo.id_usuario}
          numerico
        />
        <CampoTexto
          control={control}
          name="codigo_equipo"
          etiqueta="Codigo del equipo"
          reglas={reglasDispositivo.codigo_equipo}
          maxLength={LARGOS_DISPOSITIVO.codigo_equipo}
          ayuda="Debe ser unico."
        />
        <CampoTexto
          control={control}
          name="tipo_dispositivo"
          etiqueta="Tipo de dispositivo"
          reglas={reglasDispositivo.tipo_dispositivo}
          maxLength={LARGOS_DISPOSITIVO.tipo_dispositivo}
        />
        <CampoTexto
          control={control}
          name="sistema_operativo"
          etiqueta="Sistema operativo"
          reglas={reglasDispositivo.sistema_operativo}
          maxLength={LARGOS_DISPOSITIVO.sistema_operativo}
        />
        <CampoTexto
          control={control}
          name="fecha_ultima_actualizacion"
          etiqueta="Ultima actualizacion"
          type="date"
          reglas={reglasDispositivo.fecha_ultima_actualizacion}
        />
        <CampoCheckbox
          control={control}
          name="antivirus_activo"
          etiqueta="Antivirus activo"
        />
        <CampoCheckbox control={control} name="tiene_ups" etiqueta="Tiene UPS" />
      </RejillaCampos>

      <p>
        Estado de seguridad previsto:{" "}
        <Badge tono={previsto === "Cumple" ? "ok" : "malo"}>{previsto}</Badge>{" "}
        <span>El valor definitivo lo calcula el servidor.</span>
      </p>

      <AccionesFormulario guardando={guardando} onCancelar={onCancelar} />
    </Formulario>
  );
}
