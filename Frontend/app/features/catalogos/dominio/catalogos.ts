import * as v from "@/shared/verificar/primitivas";
import {
  idPlataforma,
  idProducto,
  idUsuario,
  type IdPlataforma,
  type IdProducto,
  type IdUsuario,
} from "@/shared/tipos/marca";

/** contrato-api.md §10.1. `correo` es PII: no debe aparecer en logs. */
export interface UsuarioLookup {
  readonly id_usuario: IdUsuario;
  readonly nombre: string;
  readonly correo: string;
  readonly rol: string;
  readonly estado: string;
}

export function aUsuarioLookup(x: unknown, ruta = "usuario"): UsuarioLookup {
  const o = v.objeto(x, ruta);
  return {
    id_usuario: idUsuario(v.entero(o.id_usuario, `${ruta}.id_usuario`)),
    nombre: v.texto(o.nombre, `${ruta}.nombre`),
    correo: v.texto(o.correo, `${ruta}.correo`),
    rol: v.texto(o.rol, `${ruta}.rol`),
    estado: v.texto(o.estado, `${ruta}.estado`),
  };
}

export const aListaUsuarios = (x: unknown): UsuarioLookup[] =>
  v.lista(x, "usuarios", aUsuarioLookup);

/** contrato-api.md §10.2 */
export interface Plataforma {
  readonly id_plataforma: IdPlataforma;
  readonly nombre: string;
}

export function aPlataforma(x: unknown, ruta = "plataforma"): Plataforma {
  const o = v.objeto(x, ruta);
  return {
    id_plataforma: idPlataforma(v.entero(o.id_plataforma, `${ruta}.id_plataforma`)),
    nombre: v.texto(o.nombre, `${ruta}.nombre`),
  };
}

export const aListaPlataformas = (x: unknown): Plataforma[] =>
  v.lista(x, "plataformas", aPlataforma);

/** contrato-api.md §10.3 */
export const ESTADOS_PRODUCTO = ["Activo", "Inactivo"] as const;
export type EstadoProducto = (typeof ESTADOS_PRODUCTO)[number];

export interface Producto {
  readonly id_producto: IdProducto;
  readonly nombre_producto: string;
  readonly descripcion: string | null;
  readonly estado: EstadoProducto;
}

export function aProducto(x: unknown, ruta = "producto"): Producto {
  const o = v.objeto(x, ruta);
  return {
    id_producto: idProducto(v.entero(o.id_producto, `${ruta}.id_producto`)),
    nombre_producto: v.texto(o.nombre_producto, `${ruta}.nombre_producto`),
    descripcion: v.textoNulable(o.descripcion, `${ruta}.descripcion`),
    estado: v.literal(o.estado, ESTADOS_PRODUCTO, `${ruta}.estado`),
  };
}

export const aListaProductos = (x: unknown): Producto[] =>
  v.lista(x, "productos", aProducto);
