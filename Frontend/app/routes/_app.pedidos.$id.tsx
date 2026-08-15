import { useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/_app.pedidos.$id";
import { RUTAS } from "@/rutas";
import { requerirSesion } from "@/shared/auth/requerir";
import { ROLES_ESCRITURA } from "@/shared/tipos/rol";
import { idPedidoDesde } from "@/shared/tipos/marca";
import { ejecutarAccion, type ResultadoAccion } from "@/shared/api/resultado";
import { useAccion } from "@/shared/api/useAccion";
import { Alert } from "@/shared/ui/Alert/Alert";
import { Badge } from "@/shared/ui/Badge/Badge";
import { Boton } from "@/shared/ui/Boton/Boton";
import { EncabezadoPagina } from "@/shared/ui/EncabezadoPagina/EncabezadoPagina";
import { EstadoVacio } from "@/shared/ui/EstadoVacio/EstadoVacio";
import { ModalConfirmacion } from "@/shared/ui/Modal/ModalConfirmacion";
import {
  ColumnaDetalle,
  Dato,
  ListaDatos,
  PanelDetalle,
  RejillaDetalle,
} from "@/shared/ui/Detalle/Detalle";
import { formatearFecha, formatearMoneda } from "@/shared/utils/formato";
import { listarClientes } from "@/features/clientes/api/clientesApi";
import {
  actualizarCabeceraPedido,
  cancelarPedido,
  obtenerPedido,
} from "@/features/pedidos/api/pedidosApi";
import {
  tonoEstadoPedido,
  type DatosCabeceraPedido,
} from "@/features/pedidos/dominio/pedido";
import { CabeceraPedidoFormulario } from "@/features/pedidos/components/CabeceraPedidoFormulario";
import { LineasPedidoTabla } from "@/features/pedidos/components/LineasPedidoTabla";

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `Pedido #${loaderData.pedido.id_pedido} · VinkaPlant` }];
}

export async function clientLoader({ params, request }: Route.ClientLoaderArgs) {
  const usuario = await requerirSesion(request);
  const id = idPedidoDesde(params.id);
  const puedeEscribir = ROLES_ESCRITURA.includes(usuario.id_rol);

  const [pedido, clientes] = await Promise.all([
    obtenerPedido(id, request.signal),
    puedeEscribir ? listarClientes(request.signal) : Promise.resolve([]),
  ]);

  return {
    pedido,
    clientes: clientes.map((c) => ({ valor: c.id_cliente, etiqueta: c.nombre })),
    puedeEscribir,
  };
}

type PeticionPedido =
  | { readonly intencion: "cabecera"; readonly datos: DatosCabeceraPedido }
  | { readonly intencion: "cancelar" };

export async function clientAction({
  params,
  request,
}: Route.ClientActionArgs): Promise<ResultadoAccion> {
  await requerirSesion(request);
  const id = idPedidoDesde(params.id);
  const peticion = (await request.json()) as PeticionPedido;

  return ejecutarAccion(async () => {
    switch (peticion.intencion) {
      case "cabecera":
        return await actualizarCabeceraPedido(id, peticion.datos);
      case "cancelar":
        return await cancelarPedido(id);
    }
  });
}

export default function DetalleDePedido({ loaderData }: Route.ComponentProps) {
  const { pedido, clientes, puedeEscribir } = loaderData;
  const accion = useAccion("pedido-detalle");
  const [cancelacionPedida, setCancelacionPedida] = useState(false);

  const cancelable = puedeEscribir && pedido.estado !== "Cancelado";
  const confirmarCancelar = cancelacionPedida && !accion.exito;

  return (
    <>
      <EncabezadoPagina
        titulo={`Pedido #${pedido.id_pedido}`}
        subtitulo={`${pedido.cliente} · ${formatearFecha(pedido.fecha)}`}
        acciones={
          <>
            <Link to={RUTAS.pedidos}>← Volver a pedidos</Link>
            {cancelable && (
              <Boton
                variante="peligro"
                disabled={accion.ocupado}
                onClick={() => {
                  accion.reiniciar();
                  setCancelacionPedida(true);
                }}
              >
                Cancelar pedido
              </Boton>
            )}
          </>
        }
      />

      {accion.exito && <Alert tono="exito">{accion.resultado?.mensaje}</Alert>}
      {accion.error !== null && !confirmarCancelar && (
        <Alert tono="error">{accion.error}</Alert>
      )}

      <RejillaDetalle>
        <ColumnaDetalle>
          <PanelDetalle titulo="Resumen">
            <ListaDatos>
              <Dato etiqueta="Cliente">{pedido.cliente}</Dato>
              <Dato etiqueta="Registrado por">{pedido.usuario}</Dato>
              <Dato etiqueta="Fecha">{formatearFecha(pedido.fecha)}</Dato>
              <Dato etiqueta="Estado">
                <Badge tono={tonoEstadoPedido(pedido.estado)}>
                  {pedido.estado}
                </Badge>
              </Dato>
              <Dato etiqueta="Total">{formatearMoneda(pedido.total)}</Dato>
            </ListaDatos>
          </PanelDetalle>

          <PanelDetalle titulo="Plantas del pedido">
            {pedido.detalles.length === 0 ? (
              <EstadoVacio titulo="Este pedido no tiene lineas" />
            ) : (
              <LineasPedidoTabla lineas={pedido.detalles} total={pedido.total} />
            )}
          </PanelDetalle>
        </ColumnaDetalle>

        {puedeEscribir && (
          <ColumnaDetalle>
            <PanelDetalle titulo="Editar cabecera">
              <p>
                El contrato solo permite actualizar cliente, fecha y estado. Las
                lineas no se editan una vez creado el pedido.
              </p>
              <CabeceraPedidoFormulario
                pedido={pedido}
                clientes={clientes}
                guardando={accion.ocupado}
                errorServidor={null}
                onGuardar={(datos) => {
                  accion.enviar({ intencion: "cabecera", datos });
                }}
              />
            </PanelDetalle>
          </ColumnaDetalle>
        )}
      </RejillaDetalle>

      <ModalConfirmacion
        abierto={confirmarCancelar}
        titulo="Cancelar pedido"
        mensaje={`Se cancelara el pedido #${pedido.id_pedido}. La operacion no se puede deshacer desde la aplicacion.`}
        textoConfirmar="Cancelar pedido"
        destructivo
        ocupado={accion.ocupado}
        error={accion.error}
        onCancelar={() => {
          setCancelacionPedida(false);
        }}
        onConfirmar={() => {
          accion.enviar({ intencion: "cancelar" });
        }}
      />
    </>
  );
}
