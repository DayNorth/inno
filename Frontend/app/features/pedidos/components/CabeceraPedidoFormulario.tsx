import { useForm } from "react-hook-form";
import { Alert } from "@/shared/ui/Alert/Alert";
import { AccionesFormulario } from "@/shared/ui/campos/AccionesFormulario";
import { CampoSelect, type OpcionSelect } from "@/shared/ui/campos/CampoSelect";
import { CampoTexto } from "@/shared/ui/campos/CampoTexto";
import { Formulario } from "@/shared/ui/campos/Formulario";
import { RejillaCampos } from "@/shared/ui/campos/RejillaCampos";
import { ResumenErrores } from "@/shared/ui/campos/ResumenErrores";
import {
  ESTADOS_PEDIDO,
  type DatosCabeceraPedido,
  type PedidoDetalle,
} from "../dominio/pedido";
import {
  aFormularioCabecera,
  aPayloadCabecera,
  reglasCabecera,
  type CabeceraForm,
} from "../formulario/reglas";

interface Props {
  readonly pedido: PedidoDetalle;
  readonly clientes: readonly OpcionSelect[];
  readonly guardando: boolean;
  readonly errorServidor: string | null;
  readonly onGuardar: (datos: DatosCabeceraPedido) => void;
}

/** Aqui el estado SI admite los 4 valores, incluido `Cancelado` (§4.4). */
const OPCIONES_ESTADO: readonly OpcionSelect[] = ESTADOS_PEDIDO.map((e) => ({
  valor: e,
  etiqueta: e,
}));

export function CabeceraPedidoFormulario({
  pedido,
  clientes,
  guardando,
  errorServidor,
  onGuardar,
}: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitted },
  } = useForm<CabeceraForm>({
    defaultValues: aFormularioCabecera(pedido),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  return (
    <Formulario
      onSubmit={handleSubmit((f) => {
        onGuardar(aPayloadCabecera(f));
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
          reglas={reglasCabecera.id_cliente}
          numerico
        />
        <CampoTexto
          control={control}
          name="fecha"
          etiqueta="Fecha"
          type="date"
          reglas={reglasCabecera.fecha}
        />
        {/* El pedido ya trae estado, asi que tampoco lleva opcion vacia. */}
        <CampoSelect
          control={control}
          name="estado"
          etiqueta="Estado"
          opciones={OPCIONES_ESTADO}
          reglas={reglasCabecera.estado}
          placeholder={null}
        />
      </RejillaCampos>

      <AccionesFormulario guardando={guardando} editando textoGuardar="Guardar cabecera" />
    </Formulario>
  );
}
