import { useForm } from "react-hook-form";
import { Alert } from "@/shared/ui/Alert/Alert";
import { AccionesFormulario } from "@/shared/ui/campos/AccionesFormulario";
import { CampoSelect, type OpcionSelect } from "@/shared/ui/campos/CampoSelect";
import { CampoTexto } from "@/shared/ui/campos/CampoTexto";
import { Formulario } from "@/shared/ui/campos/Formulario";
import { RejillaCampos } from "@/shared/ui/campos/RejillaCampos";
import { ResumenErrores } from "@/shared/ui/campos/ResumenErrores";
import { ESTADOS_AL_CREAR, type DatosPedidoNuevo } from "../dominio/pedido";
import {
  aPayloadPedido,
  reglasPedido,
  subtotalExcedido,
  valoresInicialesPedido,
  type PedidoForm,
} from "../formulario/reglas";
import { EditorLineas } from "./EditorLineas";

interface Props {
  readonly clientes: readonly OpcionSelect[];
  readonly productos: readonly OpcionSelect[];
  readonly guardando: boolean;
  readonly errorServidor: string | null;
  readonly onGuardar: (datos: DatosPedidoNuevo) => void;
  readonly onCancelar: () => void;
}

const OPCIONES_ESTADO: readonly OpcionSelect[] = ESTADOS_AL_CREAR.map((e) => ({
  valor: e,
  etiqueta: e,
}));

export function PedidoFormulario({
  clientes,
  productos,
  guardando,
  errorServidor,
  onGuardar,
  onCancelar,
}: Props) {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitted },
  } = useForm<PedidoForm>({
    defaultValues: valoresInicialesPedido(),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  return (
    <Formulario
      onSubmit={handleSubmit((f) => {
        if (f.detalles.length === 0) {
          setError("detalles", {
            message: "El pedido debe incluir al menos una planta",
          });
          return;
        }

        // Validacion cruzada cantidad x precio: el backend la aplica por linea,
        // y aqui se detecta antes del round-trip.
        const indice = f.detalles.findIndex(subtotalExcedido);
        if (indice !== -1) {
          setError(`detalles.${indice}.cantidad`, {
            message: "El subtotal de la linea supera el maximo permitido",
          });
          return;
        }

        onGuardar(aPayloadPedido(f));
      })}
    >
      {errorServidor !== null && <Alert tono="error">{errorServidor}</Alert>}
      <ResumenErrores errores={errors} visible={isSubmitted} />

      <RejillaCampos>
        <CampoSelect
          control={control}
          name="id_cliente"
          etiqueta="Cliente"
          opciones={clientes}
          reglas={reglasPedido.id_cliente}
          numerico
        />
        <CampoTexto
          control={control}
          name="fecha"
          etiqueta="Fecha"
          type="date"
          reglas={reglasPedido.fecha}
        />
        {/* Sin opcion vacia: el estado arranca en "Pendiente" y el contrato
            solo admite valores del conjunto cerrado. */}
        <CampoSelect
          control={control}
          name="estado"
          etiqueta="Estado"
          opciones={OPCIONES_ESTADO}
          reglas={reglasPedido.estado}
          placeholder={null}
        />
      </RejillaCampos>

      <EditorLineas control={control} productos={productos} disabled={guardando} />

      <AccionesFormulario
        guardando={guardando}
        textoGuardar="Crear pedido"
        onCancelar={onCancelar}
      />
    </Formulario>
  );
}
