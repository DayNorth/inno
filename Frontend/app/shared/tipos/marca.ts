/**
 * IDs marcados (branded types).
 *
 * Todos los IDs del contrato son `number`. Sin marca,
 * `inactivarCliente(idPedido)` compila sin queja. Con marca, no.
 */

declare const marca: unique symbol;

export type Marcado<M extends string> = number & { readonly [marca]: M };

export type IdCliente = Marcado<"Cliente">;
export type IdPedido = Marcado<"Pedido">;
export type IdProveedor = Marcado<"Proveedor">;
export type IdUsuario = Marcado<"Usuario">;
export type IdProducto = Marcado<"Producto">;
export type IdPlataforma = Marcado<"Plataforma">;
export type IdAcceso = Marcado<"Acceso">;
export type IdDispositivo = Marcado<"Dispositivo">;
export type IdRiesgo = Marcado<"Riesgo">;
export type IdIncidente = Marcado<"Incidente">;
export type IdEvaluacion = Marcado<"Evaluacion">;
export type IdPlan = Marcado<"Plan">;
export type IdBitacora = Marcado<"Bitacora">;
export type IdDetallePedido = Marcado<"DetallePedido">;
export type IdPermiso = Marcado<"Permiso">;

const marcar = <M extends string>(n: number): Marcado<M> => n as Marcado<M>;

export const idCliente = (n: number): IdCliente => marcar<"Cliente">(n);
export const idPedido = (n: number): IdPedido => marcar<"Pedido">(n);
export const idProveedor = (n: number): IdProveedor => marcar<"Proveedor">(n);
export const idUsuario = (n: number): IdUsuario => marcar<"Usuario">(n);
export const idProducto = (n: number): IdProducto => marcar<"Producto">(n);
export const idPlataforma = (n: number): IdPlataforma => marcar<"Plataforma">(n);
export const idAcceso = (n: number): IdAcceso => marcar<"Acceso">(n);
export const idDispositivo = (n: number): IdDispositivo => marcar<"Dispositivo">(n);
export const idRiesgo = (n: number): IdRiesgo => marcar<"Riesgo">(n);
export const idIncidente = (n: number): IdIncidente => marcar<"Incidente">(n);
export const idEvaluacion = (n: number): IdEvaluacion => marcar<"Evaluacion">(n);
export const idPlan = (n: number): IdPlan => marcar<"Plan">(n);
export const idBitacora = (n: number): IdBitacora => marcar<"Bitacora">(n);
export const idDetallePedido = (n: number): IdDetallePedido =>
  marcar<"DetallePedido">(n);
export const idPermiso = (n: number): IdPermiso => marcar<"Permiso">(n);

/** Tope de `int` en SQL Server. El backend rechaza cualquier `:id` mayor. */
const MAX_INT = 2147483647;

/**
 * Convierte un parametro de ruta (siempre `string`) en un entero positivo.
 * Un `/pedidos/abc` se convierte en un 404 del router ANTES de tocar la red,
 * en vez de generar una peticion inutil que el backend rechazaria con 400.
 */
export function enteroDeRuta(bruto: string | undefined): number {
  if (bruto === undefined || !/^\d+$/.test(bruto)) {
    throw new Response("No encontrado", { status: 404 });
  }
  const n = Number(bruto);
  if (!Number.isInteger(n) || n <= 0 || n > MAX_INT) {
    throw new Response("No encontrado", { status: 404 });
  }
  return n;
}

export const idPedidoDesde = (bruto: string | undefined): IdPedido =>
  idPedido(enteroDeRuta(bruto));

export const idProveedorDesde = (bruto: string | undefined): IdProveedor =>
  idProveedor(enteroDeRuta(bruto));
