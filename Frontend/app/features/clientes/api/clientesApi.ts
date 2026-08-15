import { pedir } from "@/shared/api/cliente";
import * as v from "@/shared/verificar/primitivas";
import type { IdCliente } from "@/shared/tipos/marca";
import { aListaClientes, type Cliente, type DatosCliente } from "../dominio/cliente";

export const listarClientes = (signal?: AbortSignal): Promise<Cliente[]> =>
  pedir("/api/clientes", aListaClientes, { signal });

/** Activos e inactivos. Alimenta el filtro "ver inactivos" de la pantalla. */
export const listarTodosLosClientes = (signal?: AbortSignal): Promise<Cliente[]> =>
  pedir("/api/clientes/todos", aListaClientes, { signal });

export const crearCliente = (datos: DatosCliente): Promise<string> =>
  pedir("/api/clientes", v.mensaje, { metodo: "POST", cuerpo: datos });

export const actualizarCliente = (
  id: IdCliente,
  datos: DatosCliente,
): Promise<string> =>
  pedir(`/api/clientes/${id}`, v.mensaje, { metodo: "PUT", cuerpo: datos });

export const inactivarCliente = (id: IdCliente): Promise<string> =>
  pedir(`/api/clientes/${id}/inactivar`, v.mensaje, { metodo: "PATCH" });

export const reactivarCliente = (id: IdCliente): Promise<string> =>
  pedir(`/api/clientes/${id}/reactivar`, v.mensaje, { metodo: "PATCH" });
