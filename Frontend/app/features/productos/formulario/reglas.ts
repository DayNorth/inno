import {
  enteroEntre,
  largoMaximo,
  obligatorio,
  opcional,
  recortado,
  type Reglas,
} from "@/shared/formularios/tipos";
import {
  ESTADOS_FITOSANITARIOS,
  LARGOS_PRODUCTO,
  type DatosProducto,
  type EstadoFitosanitario,
  type Producto,
} from "../dominio/producto";

/** Lo que el usuario teclea: cantidad viaja como number (CampoNumero). */
export interface ProductoForm {
  nombre_producto: string;
  descripcion: string;
  cantidad_disponible: number | null;
  estado_fitosanitario: string;
  ubicacion_invernadero: string;
}

const CANTIDAD_MAX = 2147483647;

export const reglasProducto = {
  nombre_producto: {
    ...obligatorio("El nombre del producto"),
    ...largoMaximo(LARGOS_PRODUCTO.nombre_producto),
  },
  descripcion: largoMaximo(LARGOS_PRODUCTO.descripcion),
  cantidad_disponible: enteroEntre(
    0,
    CANTIDAD_MAX,
    "La cantidad disponible no puede ser negativa",
  ),
  ubicacion_invernadero: largoMaximo(LARGOS_PRODUCTO.ubicacion_invernadero),
} satisfies Reglas<ProductoForm>;

export const valoresInicialesProducto: ProductoForm = {
  nombre_producto: "",
  descripcion: "",
  cantidad_disponible: 0,
  estado_fitosanitario: "Sano",
  ubicacion_invernadero: "",
};

export const aFormulario = (p: Producto): ProductoForm => ({
  nombre_producto: p.nombre_producto,
  descripcion: p.descripcion ?? "",
  cantidad_disponible: p.cantidad_disponible,
  estado_fitosanitario: p.estado_fitosanitario,
  ubicacion_invernadero: p.ubicacion_invernadero ?? "",
});

const esEstadoFitosanitario = (v: string): v is EstadoFitosanitario =>
  (ESTADOS_FITOSANITARIOS as readonly string[]).includes(v);

/** Normalizacion explicita form -> payload, igual criterio que Clientes. */
export const aPayload = (f: ProductoForm): DatosProducto => ({
  nombre_producto: recortado(f.nombre_producto),
  descripcion: opcional(f.descripcion),
  cantidad_disponible: f.cantidad_disponible ?? 0,
  estado_fitosanitario: esEstadoFitosanitario(f.estado_fitosanitario)
    ? f.estado_fitosanitario
    : "Sano",
  ubicacion_invernadero: opcional(f.ubicacion_invernadero),
});
