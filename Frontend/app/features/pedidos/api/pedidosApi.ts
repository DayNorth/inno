import { pedir } from "@/shared/api/cliente";
import * as v from "@/shared/verificar/primitivas";
import type { IdPedido } from "@/shared/tipos/marca";
import {
  aListaPedidos,
  aPedidoDetalle,
  type DatosCabeceraPedido,
  type DatosPedidoNuevo,
  type PedidoDetalle,
  type PedidoLista,
} from "../dominio/pedido";

export const listarPedidos = (signal?: AbortSignal): Promise<PedidoLista[]> =>
  pedir("/api/pedidos", aListaPedidos, { signal });

export const obtenerPedido = (
  id: IdPedido,
  signal?: AbortSignal,
): Promise<PedidoDetalle> =>
  pedir(`/api/pedidos/${id}`, aPedidoDetalle, { signal });

/** El POST devuelve SOLO `id_pedido`, no el pedido completo (§13.9). */
export const crearPedido = (datos: DatosPedidoNuevo): Promise<number> =>
  pedir(
    "/api/pedidos",
    (crudo, ruta) => v.entero(v.objeto(crudo, ruta).id_pedido, `${ruta}.id_pedido`),
    { metodo: "POST", cuerpo: datos },
  );

/**
 * PUT y PATCH devuelven objetos PARCIALES, no la entidad completa (§13.10).
 *
 * `PATCH /:id/estado` existe en el contrato y no se usa: la pantalla de detalle
 * cambia el estado con este PUT, que ademas admite `Cancelado`. Ofrecer dos
 * caminos para lo mismo solo confunde.
 */
export const actualizarCabeceraPedido = (
  id: IdPedido,
  datos: DatosCabeceraPedido,
): Promise<string> =>
  pedir(`/api/pedidos/${id}`, v.mensaje, { metodo: "PUT", cuerpo: datos });

export const cancelarPedido = (id: IdPedido): Promise<string> =>
  pedir(`/api/pedidos/${id}/cancelar`, v.mensaje, { metodo: "PATCH" });
