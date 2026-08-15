import { useForm } from "react-hook-form";
import { Alert } from "@/shared/ui/Alert/Alert";
import { AccionesFormulario } from "@/shared/ui/campos/AccionesFormulario";
import { CampoTexto } from "@/shared/ui/campos/CampoTexto";
import { Formulario } from "@/shared/ui/campos/Formulario";
import { ResumenErrores } from "@/shared/ui/campos/ResumenErrores";
import { opcional } from "@/shared/formularios/tipos";
import type { Incidente } from "../dominio/incidente";
import { reglasResolucion, type ResolucionForm } from "../formulario/reglas";

interface Props {
  readonly incidente: Incidente;
  readonly guardando: boolean;
  readonly errorServidor: string | null;
  readonly onResolver: (fechaResolucion: string | null) => void;
  readonly onCancelar: () => void;
}

export function ResolverIncidenteFormulario({
  incidente,
  guardando,
  errorServidor,
  onResolver,
  onCancelar,
}: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitted },
  } = useForm<ResolucionForm>({
    defaultValues: { fecha_resolucion: "" },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const reglas = reglasResolucion(incidente.fecha_inicio);

  return (
    <Formulario
      onSubmit={handleSubmit((f) => {
        onResolver(opcional(f.fecha_resolucion));
      })}
    >
      {errorServidor !== null && <Alert tono="error">{errorServidor}</Alert>}
      <ResumenErrores errores={errors} visible={isSubmitted} />

      <CampoTexto
        control={control}
        name="fecha_resolucion"
        etiqueta="Fecha de resolucion"
        type="date"
        reglas={reglas.fecha_resolucion}
        ayuda="Si se deja vacia, el servidor usa la fecha y hora actuales."
      />

      <AccionesFormulario
        guardando={guardando}
        textoGuardar="Resolver"
        onCancelar={onCancelar}
      />
    </Formulario>
  );
}
