import * as v from "@/shared/verificar/primitivas";
import { idProducto, type IdProducto } from "@/shared/tipos/marca";

export const ESTADOS_PRODUCTO = ["Activo", "Inactivo"] as const;
export type EstadoProducto = (typeof ESTADOS_PRODUCTO)[number];

/**
 * Catalogo cerrado de estado fitosanitario (Backend/validation/productos.schema.js
 * `ESTADOS_FITOSANITARIOS`). "Sano" es el default en BD.
 */
export const ESTADOS_FITOSANITARIOS = [
  "Sano",
  "En observación",
  "En tratamiento",
  "Rechazado",
] as const;
export type EstadoFitosanitario = (typeof ESTADOS_FITOSANITARIOS)[number];

/** Topes reales de columna. */
export const LARGOS_PRODUCTO = {
  nombre_producto: 150,
  descripcion: 255,
  ubicacion_invernadero: 100,
} as const;

export interface Producto {
  readonly id_producto: IdProducto;
  readonly nombre_producto: string;
  readonly descripcion: string | null;
  readonly estado: EstadoProducto;
  readonly cantidad_disponible: number;
  readonly estado_fitosanitario: EstadoFitosanitario;
  readonly ubicacion_invernadero: string | null;
}

export function aProducto(x: unknown, ruta = "producto"): Producto {
  const o = v.objeto(x, ruta);
  return {
    id_producto: idProducto(v.entero(o.id_producto, `${ruta}.id_producto`)),
    nombre_producto: v.texto(o.nombre_producto, `${ruta}.nombre_producto`),
    descripcion: v.textoNulable(o.descripcion, `${ruta}.descripcion`),
    estado: v.literal(o.estado, ESTADOS_PRODUCTO, `${ruta}.estado`),
    cantidad_disponible: v.entero(
      o.cantidad_disponible,
      `${ruta}.cantidad_disponible`,
    ),
    estado_fitosanitario: v.literal(
      o.estado_fitosanitario,
      ESTADOS_FITOSANITARIOS,
      `${ruta}.estado_fitosanitario`,
    ),
    ubicacion_invernadero: v.textoNulable(
      o.ubicacion_invernadero,
      `${ruta}.ubicacion_invernadero`,
    ),
  };
}

export const aListaProductos = (x: unknown): Producto[] =>
  v.lista(x, "productos", aProducto);

/** Payload hacia la API: crear y actualizar comparten la misma forma. */
export interface DatosProducto {
  readonly nombre_producto: string;
  readonly descripcion: string | null;
  readonly cantidad_disponible: number;
  readonly estado_fitosanitario: EstadoFitosanitario;
  readonly ubicacion_invernadero: string | null;
}
