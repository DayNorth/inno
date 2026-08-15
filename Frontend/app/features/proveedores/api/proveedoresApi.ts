import { pedir } from "@/shared/api/cliente";
import * as v from "@/shared/verificar/primitivas";
import type { IdProveedor } from "@/shared/tipos/marca";
import {
  aListaProveedores,
  aProveedorDetalle,
  type CriteriosEvaluacion,
  type DatosPlan,
  type DatosProveedor,
  type ProveedorDetalle,
  type ProveedorLista,
} from "../dominio/proveedor";

export const listarProveedores = (signal?: AbortSignal): Promise<ProveedorLista[]> =>
  pedir("/api/proveedores", aListaProveedores, { signal });

export const obtenerProveedor = (
  id: IdProveedor,
  signal?: AbortSignal,
): Promise<ProveedorDetalle> =>
  pedir(`/api/proveedores/${id}`, aProveedorDetalle, { signal });

/**
 * Crear un proveedor ES evaluarlo: la evaluacion inicial es obligatoria y se
 * inserta en la misma transaccion. Por eso el backend responde "Proveedor
 * evaluado correctamente" y no "creado".
 */
export const crearProveedor = (datos: DatosProveedor): Promise<string> =>
  pedir("/api/proveedores", v.mensaje, { metodo: "POST", cuerpo: datos });

export const registrarEvaluacion = (
  id: IdProveedor,
  criterios: CriteriosEvaluacion,
): Promise<string> =>
  pedir(`/api/proveedores/${id}/evaluaciones`, v.mensaje, {
    metodo: "POST",
    cuerpo: criterios,
  });

export const registrarPlan = (
  id: IdProveedor,
  datos: DatosPlan,
): Promise<string> =>
  pedir(`/api/proveedores/${id}/planes-contingencia`, v.mensaje, {
    metodo: "POST",
    cuerpo: datos,
  });
