import * as v from "@/shared/verificar/primitivas";
import { idCliente, type IdCliente } from "@/shared/tipos/marca";

export const ESTADOS_CLIENTE = ["Activo", "Inactivo"] as const;
export type EstadoCliente = (typeof ESTADOS_CLIENTE)[number];

/** Topes reales de columna (contrato-api.md §3.3). */
export const LARGOS_CLIENTE = {
  nombre: 150,
  pais: 100,
  correo: 100,
  telefono: 30,
} as const;

export interface Cliente {
  readonly id_cliente: IdCliente;
  readonly nombre: string;
  readonly pais: string | null;
  readonly correo: string | null;
  readonly telefono: string | null;
  readonly estado: EstadoCliente;
}

/** Convierte `unknown` de la red en un `Cliente` garantizado, o lanza. */
export function aCliente(x: unknown, ruta = "cliente"): Cliente {
  const o = v.objeto(x, ruta);
  return {
    id_cliente: idCliente(v.entero(o.id_cliente, `${ruta}.id_cliente`)),
    nombre: v.texto(o.nombre, `${ruta}.nombre`),
    pais: v.textoNulable(o.pais, `${ruta}.pais`),
    correo: v.textoNulable(o.correo, `${ruta}.correo`),
    telefono: v.textoNulable(o.telefono, `${ruta}.telefono`),
    estado: v.literal(o.estado, ESTADOS_CLIENTE, `${ruta}.estado`),
  };
}

export const aListaClientes = (x: unknown): Cliente[] =>
  v.lista(x, "clientes", aCliente);

/** Payload hacia la API: los opcionales viajan como `null`, no como "". */
export interface DatosCliente {
  readonly nombre: string;
  readonly pais: string | null;
  readonly correo: string | null;
  readonly telefono: string | null;
}
