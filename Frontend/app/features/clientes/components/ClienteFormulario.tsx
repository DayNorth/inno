import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/shared/ui/Alert/Alert";
import { AccionesFormulario } from "@/shared/ui/campos/AccionesFormulario";
import { CampoTexto } from "@/shared/ui/campos/CampoTexto";
import { Formulario } from "@/shared/ui/campos/Formulario";
import { RejillaCampos } from "@/shared/ui/campos/RejillaCampos";
import { ResumenErrores } from "@/shared/ui/campos/ResumenErrores";
import { LARGOS_CLIENTE, type Cliente } from "../dominio/cliente";
import type { DatosCliente } from "../dominio/cliente";
import {
  aFormulario,
  aPayload,
  reglasCliente,
  valoresInicialesCliente,
  type ClienteForm,
} from "../formulario/reglas";

interface Props {
  readonly clienteEnEdicion: Cliente | null;
  readonly guardando: boolean;
  readonly errorServidor: string | null;
  readonly onGuardar: (datos: DatosCliente) => void;
  readonly onCancelar: () => void;
}

export function ClienteFormulario({
  clienteEnEdicion,
  guardando,
  errorServidor,
  onGuardar,
  onCancelar,
}: Props) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitted },
  } = useForm<ClienteForm>({
    defaultValues: valoresInicialesCliente,
    // Valida al salir del campo, pero corrige en vivo tras el primer error.
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    reset(
      clienteEnEdicion === null
        ? valoresInicialesCliente
        : aFormulario(clienteEnEdicion),
    );
  }, [clienteEnEdicion, reset]);

  return (
    <Formulario
      // handleSubmit NO llama a onGuardar si hay errores. Ese es el arreglo de
      // D-1, sin resolver de por medio.
      onSubmit={handleSubmit((f) => {
        onGuardar(aPayload(f));
      })}
    >
      {errorServidor !== null && <Alert tono="error">{errorServidor}</Alert>}
      <ResumenErrores errores={errors} visible={isSubmitted} />

      <RejillaCampos>
        <CampoTexto
          control={control}
          name="nombre"
          etiqueta="Nombre"
          reglas={reglasCliente.nombre}
          maxLength={LARGOS_CLIENTE.nombre}
        />
        <CampoTexto
          control={control}
          name="pais"
          etiqueta="Pais"
          reglas={reglasCliente.pais}
          maxLength={LARGOS_CLIENTE.pais}
        />
        <CampoTexto
          control={control}
          name="correo"
          etiqueta="Correo"
          type="email"
          reglas={reglasCliente.correo}
          maxLength={LARGOS_CLIENTE.correo}
        />
        <CampoTexto
          control={control}
          name="telefono"
          etiqueta="Telefono"
          type="tel"
          reglas={reglasCliente.telefono}
          maxLength={LARGOS_CLIENTE.telefono}
        />
      </RejillaCampos>

      <AccionesFormulario
        guardando={guardando}
        editando={clienteEnEdicion !== null}
        onCancelar={onCancelar}
      />
    </Formulario>
  );
}
