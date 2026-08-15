import {
  fechaObligatoria,
  seleccionObligatoria,
  type Reglas,
} from "@/shared/formularios/tipos";
import { hoyIso } from "@/shared/utils/formato";
import {
  TOPES_PEDIDO,
  type DatosCabeceraPedido,
  type DatosPedidoNuevo,
  type EstadoPedido,
  type PedidoDetalle,
} from "../dominio/pedido";

export interface LineaForm {
  id_producto: number | null;
  cantidad: number | null;
  precio_unitario: number | null;
}

export interface PedidoForm {
  id_cliente: number | null;
  fecha: string;
  estado: string;
  detalles: LineaForm[];
}

/**
 * Reglas de una linea. Los mensajes son literalmente los del backend, para que
 * el usuario vea el mismo texto valide quien valide.
 */
export const reglasLinea = {
  id_producto: seleccionObligatoria("un producto valido"),
  cantidad: {
    required: "La cantidad debe ser mayor que cero",
    validate: (v: unknown): string | true => {
      if (typeof v !== "number" || !Number.isInteger(v) || v <= 0) {
        return "La cantidad debe ser mayor que cero";
      }
      return (
        v <= TOPES_PEDIDO.cantidad || "La cantidad supera el maximo permitido"
      );
    },
  },
  precio_unitario: {
    required: "El precio unitario no es valido",
    validate: (v: unknown): string | true => {
      if (typeof v !== "number" || !Number.isFinite(v) || v < 0) {
        return "El precio unitario no es valido";
      }
      return (
        v <= TOPES_PEDIDO.precio ||
        "El precio unitario supera el maximo permitido"
      );
    },
  },
} satisfies Reglas<LineaForm>;

export const reglasPedido = {
  id_cliente: seleccionObligatoria("un cliente valido"),
  fecha: fechaObligatoria("La fecha"),
  estado: { required: "El estado es obligatorio" },
} satisfies Reglas<PedidoForm>;

export const lineaVacia = (): LineaForm => ({
  id_producto: null,
  cantidad: 1,
  precio_unitario: null,
});

export const valoresInicialesPedido = (): PedidoForm => ({
  id_cliente: null,
  fecha: hoyIso(),
  estado: "Pendiente",
  detalles: [lineaVacia()],
});

/** Subtotal de una linea. Solo para mostrar: lo definitivo lo calcula SQL. */
export const subtotalDeLinea = (l: LineaForm): number => {
  if (l.cantidad === null || l.precio_unitario === null) return 0;
  return l.cantidad * l.precio_unitario;
};

export const totalPrevisto = (lineas: readonly LineaForm[]): number =>
  lineas.reduce((suma, l) => suma + subtotalDeLinea(l), 0);

/** Validacion cruzada por linea, que el backend tambien aplica. */
export const subtotalExcedido = (l: LineaForm): boolean =>
  subtotalDeLinea(l) > TOPES_PEDIDO.subtotalLinea;

export const aPayloadPedido = (f: PedidoForm): DatosPedidoNuevo => ({
  id_cliente: f.id_cliente ?? 0,
  fecha: f.fecha === "" ? null : f.fecha,
  estado: f.estado,
  detalles: f.detalles.map((l) => ({
    id_producto: l.id_producto ?? 0,
    cantidad: l.cantidad ?? 0,
    precio_unitario: l.precio_unitario ?? 0,
  })),
});

// --- Edicion de cabecera -----------------------------------------------------

export interface CabeceraForm {
  id_cliente: number | null;
  fecha: string;
  estado: string;
}

export const reglasCabecera = {
  id_cliente: seleccionObligatoria("un cliente valido"),
  fecha: fechaObligatoria("La fecha"),
  estado: { required: "El estado es obligatorio" },
} satisfies Reglas<CabeceraForm>;

export const aFormularioCabecera = (p: PedidoDetalle): CabeceraForm => ({
  id_cliente: p.id_cliente,
  fecha: p.fecha.slice(0, 10),
  estado: p.estado,
});

export const aPayloadCabecera = (f: CabeceraForm): DatosCabeceraPedido => ({
  id_cliente: f.id_cliente ?? 0,
  fecha: f.fecha,
  // El `satisfies` de reglas garantiza que el select solo ofrece estados
  // validos; el backend vuelve a comprobarlo.
  estado: f.estado as EstadoPedido,
});
