import { pedir } from "@/shared/api/cliente";
import * as v from "@/shared/verificar/primitivas";
import type { IdProducto } from "@/shared/tipos/marca";
import {
  aListaProductos,
  aProducto,
  type DatosProducto,
  type Producto,
} from "../dominio/producto";

export const listarProductos = (signal?: AbortSignal): Promise<Producto[]> =>
  pedir("/api/productos", aListaProductos, { signal });

/** Activos e inactivos. Alimenta el filtro "ver inactivos" de la pantalla. */
export const listarTodosLosProductos = (
  signal?: AbortSignal,
): Promise<Producto[]> =>
  pedir("/api/productos/todos", aListaProductos, { signal });

export const obtenerProducto = (
  id: IdProducto,
  signal?: AbortSignal,
): Promise<Producto> => pedir(`/api/productos/${id}`, aProducto, { signal });

export const crearProducto = (datos: DatosProducto): Promise<string> =>
  pedir("/api/productos", v.mensaje, { metodo: "POST", cuerpo: datos });

export const actualizarProducto = (
  id: IdProducto,
  datos: DatosProducto,
): Promise<string> =>
  pedir(`/api/productos/${id}`, v.mensaje, { metodo: "PUT", cuerpo: datos });

export const inactivarProducto = (id: IdProducto): Promise<string> =>
  pedir(`/api/productos/${id}/inactivar`, v.mensaje, { metodo: "PATCH" });

export const reactivarProducto = (id: IdProducto): Promise<string> =>
  pedir(`/api/productos/${id}/reactivar`, v.mensaje, { metodo: "PATCH" });
