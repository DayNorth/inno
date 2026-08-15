import * as v from "@/shared/verificar/primitivas";
import {
  idCliente,
  idDetallePedido,
  idPedido,
  idProducto,
  idUsuario,
  type IdCliente,
  type IdDetallePedido,
  type IdPedido,
  type IdProducto,
  type IdUsuario,
} from "@/shared/tipos/marca";
import type { TonoBadge } from "@/shared/ui/Badge/Badge";

export const ESTADOS_PEDIDO = [
  "Pendiente",
  "En proceso",
  "Completado",
  "Cancelado",
] as const;
export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

/** Al CREAR, el contrato no admite `Cancelado`: para eso esta /cancelar. */
export const ESTADOS_AL_CREAR = [
  "Pendiente",
  "En proceso",
  "Completado",
] as const;

/** Topes de los campos numericos (contrato-api.md §4.3). */
export const TOPES_PEDIDO = {
  cantidad: 2147483647,
  precio: 9999999999.99,
  subtotalLinea: 999999999999.99,
} as const;

export interface PedidoLista {
  readonly id_pedido: IdPedido;
  readonly id_cliente: IdCliente;
  readonly cliente: string;
  readonly id_usuario: IdUsuario;
  readonly usuario: string;
  readonly fecha: string;
  readonly estado: EstadoPedido;
  readonly cantidad_productos: number;
  readonly total: number;
}

export function aPedidoLista(x: unknown, ruta = "pedido"): PedidoLista {
  const o = v.objeto(x, ruta);
  return {
    id_pedido: idPedido(v.entero(o.id_pedido, `${ruta}.id_pedido`)),
    id_cliente: idCliente(v.entero(o.id_cliente, `${ruta}.id_cliente`)),
    cliente: v.texto(o.cliente, `${ruta}.cliente`),
    id_usuario: idUsuario(v.entero(o.id_usuario, `${ruta}.id_usuario`)),
    usuario: v.texto(o.usuario, `${ruta}.usuario`),
    fecha: v.fechaIso(o.fecha, `${ruta}.fecha`),
    estado: v.literal(o.estado, ESTADOS_PEDIDO, `${ruta}.estado`),
    cantidad_productos: v.entero(
      o.cantidad_productos,
      `${ruta}.cantidad_productos`,
    ),
    total: v.numero(o.total, `${ruta}.total`),
  };
}

export const aListaPedidos = (x: unknown): PedidoLista[] =>
  v.lista(x, "pedidos", aPedidoLista);

export interface LineaPedido {
  readonly id_detalle: IdDetallePedido;
  readonly id_producto: IdProducto;
  readonly nombre_producto: string;
  readonly cantidad: number;
  readonly precio_unitario: number;
  /** Columna COMPUTADA por SQL Server. Enviarla es inutil: se ignora. */
  readonly subtotal: number;
}

export function aLineaPedido(x: unknown, ruta = "detalle"): LineaPedido {
  const o = v.objeto(x, ruta);
  return {
    id_detalle: idDetallePedido(v.entero(o.id_detalle, `${ruta}.id_detalle`)),
    id_producto: idProducto(v.entero(o.id_producto, `${ruta}.id_producto`)),
    nombre_producto: v.texto(o.nombre_producto, `${ruta}.nombre_producto`),
    cantidad: v.entero(o.cantidad, `${ruta}.cantidad`),
    precio_unitario: v.numero(o.precio_unitario, `${ruta}.precio_unitario`),
    subtotal: v.numero(o.subtotal, `${ruta}.subtotal`),
  };
}

export interface PedidoDetalle {
  readonly id_pedido: IdPedido;
  readonly id_cliente: IdCliente;
  readonly cliente: string;
  readonly id_usuario: IdUsuario;
  readonly usuario: string;
  readonly fecha: string;
  readonly estado: EstadoPedido;
  readonly total: number;
  readonly detalles: LineaPedido[];
}

export function aPedidoDetalle(x: unknown, ruta = "pedido"): PedidoDetalle {
  const o = v.objeto(x, ruta);
  return {
    id_pedido: idPedido(v.entero(o.id_pedido, `${ruta}.id_pedido`)),
    id_cliente: idCliente(v.entero(o.id_cliente, `${ruta}.id_cliente`)),
    cliente: v.texto(o.cliente, `${ruta}.cliente`),
    id_usuario: idUsuario(v.entero(o.id_usuario, `${ruta}.id_usuario`)),
    usuario: v.texto(o.usuario, `${ruta}.usuario`),
    fecha: v.fechaIso(o.fecha, `${ruta}.fecha`),
    estado: v.literal(o.estado, ESTADOS_PEDIDO, `${ruta}.estado`),
    total: v.numero(o.total, `${ruta}.total`),
    detalles: v.lista(o.detalles, `${ruta}.detalles`, aLineaPedido),
  };
}

export interface DatosLinea {
  readonly id_producto: number;
  readonly cantidad: number;
  readonly precio_unitario: number;
}

export interface DatosPedidoNuevo {
  readonly id_cliente: number;
  readonly fecha: string | null;
  readonly estado: string;
  readonly detalles: readonly DatosLinea[];
}

/** El PUT actualiza SOLO la cabecera; las lineas no se tocan. */
export interface DatosCabeceraPedido {
  readonly id_cliente: number;
  readonly fecha: string;
  readonly estado: EstadoPedido;
}

export const tonoEstadoPedido = (estado: EstadoPedido): TonoBadge => {
  switch (estado) {
    case "Pendiente":
      return "aviso";
    case "En proceso":
      return "info";
    case "Completado":
      return "ok";
    case "Cancelado":
      return "neutro";
  }
};
