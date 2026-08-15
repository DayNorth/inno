import { useForm } from "react-hook-form";
import { Alert } from "@/shared/ui/Alert/Alert";
import { AccionesFormulario } from "@/shared/ui/campos/AccionesFormulario";
import { CampoComboBox } from "@/shared/ui/campos/CampoComboBox";
import { CampoSelect, type OpcionSelect } from "@/shared/ui/campos/CampoSelect";
import { CampoTexto } from "@/shared/ui/campos/CampoTexto";
import { Formulario } from "@/shared/ui/campos/Formulario";
import { RejillaCampos } from "@/shared/ui/campos/RejillaCampos";
import { ResumenErrores } from "@/shared/ui/campos/ResumenErrores";
import { LARGOS_ACCESO, type DatosAcceso } from "../dominio/acceso";
import {
  aPayloadAcceso,
  reglasAcceso,
  valoresInicialesAcceso,
  type AccesoForm,
} from "../formulario/reglas";

interface Props {
  readonly usuarios: readonly OpcionSelect[];
  readonly plataformas: readonly OpcionSelect[];
  /** Roles ya registrados. Sugieren; el campo sigue admitiendo uno nuevo. */
  readonly rolesUsados: readonly string[];
  readonly guardando: boolean;
  readonly errorServidor: string | null;
  readonly onGuardar: (datos: DatosAcceso) => void;
  readonly onCancelar: () => void;
}

export function AccesoFormulario({
  usuarios,
  plataformas,
  rolesUsados,
  guardando,
  errorServidor,
  onGuardar,
  onCancelar,
}: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitted },
  } = useForm<AccesoForm>({
    defaultValues: valoresInicialesAcceso(),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  return (
    <Formulario
      onSubmit={handleSubmit((f) => {
        onGuardar(aPayloadAcceso(f));
      })}
    >
      {errorServidor !== null && <Alert tono="error">{errorServidor}</Alert>}
      <ResumenErrores errores={errors} visible={isSubmitted} />

      <RejillaCampos>
        <CampoSelect
          control={control}
          name="id_usuario"
          etiqueta="Usuario"
          opciones={usuarios}
          reglas={reglasAcceso.id_usuario}
          numerico
        />
        <CampoSelect
          control={control}
          name="id_plataforma"
          etiqueta="Plataforma"
          opciones={plataformas}
          reglas={reglasAcceso.id_plataforma}
          numerico
        />
        <CampoComboBox
          control={control}
          name="rol_acceso"
          etiqueta="Rol de acceso"
          sugerencias={rolesUsados}
          reglas={reglasAcceso.rol_acceso}
          maxLength={LARGOS_ACCESO.rol_acceso}
          ayuda="Elige uno de los ya usados o escribe uno nuevo."
        />
        <CampoTexto
          control={control}
          name="fecha_alta"
          etiqueta="Fecha de alta"
          type="date"
          reglas={reglasAcceso.fecha_alta}
        />
      </RejillaCampos>

      <AccionesFormulario guardando={guardando} onCancelar={onCancelar} />
    </Formulario>
  );
}
