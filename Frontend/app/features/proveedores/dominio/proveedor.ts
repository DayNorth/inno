import * as v from "@/shared/verificar/primitivas";
import {
  idEvaluacion,
  idPlan,
  idProveedor,
  type IdEvaluacion,
  type IdPlan,
  type IdProveedor,
} from "@/shared/tipos/marca";
import type { TonoBadge } from "@/shared/ui/Badge/Badge";

export const RESULTADOS = ["Aprobado", "Rechazado"] as const;
export type ResultadoEvaluacion = (typeof RESULTADOS)[number];

export const NIVELES_RIESGO = ["Bajo", "Medio", "Alto"] as const;
export type NivelRiesgo = (typeof NIVELES_RIESGO)[number];

export const LARGOS_PROVEEDOR = {
  nombre_proveedor: 150,
  tipo_servicio: 150,
  escenario: 255,
  procedimiento_alterno: 500,
  responsable: 100,
} as const;

export interface ProveedorLista {
  readonly id_proveedor: IdProveedor;
  readonly nombre_proveedor: string;
  readonly tipo_servicio: string | null;
  readonly estado_contrato: string;
  /** Los 5 campos de la ultima evaluacion vienen `null` EN BLOQUE si no hay. */
  readonly id_evaluacion: number | null;
  readonly fecha_evaluacion: string | null;
  readonly puntaje_total: number | null;
  readonly resultado: ResultadoEvaluacion | null;
  readonly nivel_riesgo: NivelRiesgo | null;
}

export function aProveedorLista(x: unknown, ruta = "proveedor"): ProveedorLista {
  const o = v.objeto(x, ruta);
  return {
    id_proveedor: idProveedor(v.entero(o.id_proveedor, `${ruta}.id_proveedor`)),
    nombre_proveedor: v.texto(o.nombre_proveedor, `${ruta}.nombre_proveedor`),
    tipo_servicio: v.textoNulable(o.tipo_servicio, `${ruta}.tipo_servicio`),
    estado_contrato: v.texto(o.estado_contrato, `${ruta}.estado_contrato`),
    id_evaluacion: v.enteroNulable(o.id_evaluacion, `${ruta}.id_evaluacion`),
    fecha_evaluacion: v.fechaIsoNulable(
      o.fecha_evaluacion,
      `${ruta}.fecha_evaluacion`,
    ),
    puntaje_total: v.numeroNulable(o.puntaje_total, `${ruta}.puntaje_total`),
    resultado: v.literalNulable(o.resultado, RESULTADOS, `${ruta}.resultado`),
    nivel_riesgo: v.literalNulable(
      o.nivel_riesgo,
      NIVELES_RIESGO,
      `${ruta}.nivel_riesgo`,
    ),
  };
}

export const aListaProveedores = (x: unknown): ProveedorLista[] =>
  v.lista(x, "proveedores", aProveedorLista);

export interface Evaluacion {
  readonly id_evaluacion: IdEvaluacion;
  readonly fecha_evaluacion: string;
  readonly cifrado_datos: boolean;
  readonly mfa_disponible: boolean;
  readonly sla_definido: boolean;
  readonly certificaciones_vigentes: boolean;
  readonly puntaje_total: number;
  readonly resultado: ResultadoEvaluacion;
  readonly nivel_riesgo: NivelRiesgo;
}

export function aEvaluacion(x: unknown, ruta = "evaluacion"): Evaluacion {
  const o = v.objeto(x, ruta);
  return {
    id_evaluacion: idEvaluacion(v.entero(o.id_evaluacion, `${ruta}.id_evaluacion`)),
    fecha_evaluacion: v.fechaIso(o.fecha_evaluacion, `${ruta}.fecha_evaluacion`),
    cifrado_datos: v.booleano(o.cifrado_datos, `${ruta}.cifrado_datos`),
    mfa_disponible: v.booleano(o.mfa_disponible, `${ruta}.mfa_disponible`),
    sla_definido: v.booleano(o.sla_definido, `${ruta}.sla_definido`),
    certificaciones_vigentes: v.booleano(
      o.certificaciones_vigentes,
      `${ruta}.certificaciones_vigentes`,
    ),
    puntaje_total: v.numero(o.puntaje_total, `${ruta}.puntaje_total`),
    resultado: v.literal(o.resultado, RESULTADOS, `${ruta}.resultado`),
    nivel_riesgo: v.literal(o.nivel_riesgo, NIVELES_RIESGO, `${ruta}.nivel_riesgo`),
  };
}

export interface PlanContingencia {
  readonly id_plan: IdPlan;
  readonly escenario: string;
  readonly procedimiento_alterno: string;
  readonly responsable: string | null;
  readonly fecha_actualizacion: string;
}

export function aPlan(x: unknown, ruta = "plan"): PlanContingencia {
  const o = v.objeto(x, ruta);
  return {
    id_plan: idPlan(v.entero(o.id_plan, `${ruta}.id_plan`)),
    escenario: v.texto(o.escenario, `${ruta}.escenario`),
    procedimiento_alterno: v.texto(
      o.procedimiento_alterno,
      `${ruta}.procedimiento_alterno`,
    ),
    responsable: v.textoNulable(o.responsable, `${ruta}.responsable`),
    fecha_actualizacion: v.fechaIso(
      o.fecha_actualizacion,
      `${ruta}.fecha_actualizacion`,
    ),
  };
}

export interface ProveedorDetalle {
  readonly id_proveedor: IdProveedor;
  readonly nombre_proveedor: string;
  readonly tipo_servicio: string | null;
  readonly estado_contrato: string;
  readonly evaluaciones: Evaluacion[];
  readonly planes_contingencia: PlanContingencia[];
}

export function aProveedorDetalle(
  x: unknown,
  ruta = "proveedor",
): ProveedorDetalle {
  const o = v.objeto(x, ruta);
  return {
    id_proveedor: idProveedor(v.entero(o.id_proveedor, `${ruta}.id_proveedor`)),
    nombre_proveedor: v.texto(o.nombre_proveedor, `${ruta}.nombre_proveedor`),
    tipo_servicio: v.textoNulable(o.tipo_servicio, `${ruta}.tipo_servicio`),
    estado_contrato: v.texto(o.estado_contrato, `${ruta}.estado_contrato`),
    evaluaciones: v.lista(o.evaluaciones, `${ruta}.evaluaciones`, aEvaluacion),
    planes_contingencia: v.lista(
      o.planes_contingencia,
      `${ruta}.planes_contingencia`,
      aPlan,
    ),
  };
}

export interface CriteriosEvaluacion {
  readonly cifrado_datos: boolean;
  readonly mfa_disponible: boolean;
  readonly sla_definido: boolean;
  readonly certificaciones_vigentes: boolean;
}

export interface DatosProveedor extends CriteriosEvaluacion {
  readonly nombre_proveedor: string;
  readonly tipo_servicio: string | null;
}

export interface DatosPlan {
  readonly escenario: string;
  readonly procedimiento_alterno: string;
  readonly responsable: string | null;
}

/**
 * Calculo del servidor, replicado solo para previsualizar (contrato §5.3).
 * Cuatro criterios booleanos, 25 puntos cada uno.
 *
 * Con incrementos de 25, los umbrales 85 y 60 no son alcanzables exactamente:
 * el resultado neto es que solo 75 y 100 aprueban (75 -> Medio, 100 -> Bajo).
 * LA AUTORIDAD SIGUE SIENDO EL SERVIDOR.
 */
export function evaluacionPrevista(c: CriteriosEvaluacion): {
  readonly puntaje: number;
  readonly resultado: ResultadoEvaluacion;
  readonly nivel: NivelRiesgo;
} {
  const puntaje =
    25 *
    [
      c.cifrado_datos,
      c.mfa_disponible,
      c.sla_definido,
      c.certificaciones_vigentes,
    ].filter(Boolean).length;

  return {
    puntaje,
    resultado: puntaje >= 70 ? "Aprobado" : "Rechazado",
    nivel: puntaje >= 85 ? "Bajo" : puntaje >= 60 ? "Medio" : "Alto",
  };
}

export const tonoResultado = (r: ResultadoEvaluacion | null): TonoBadge =>
  r === null ? "neutro" : r === "Aprobado" ? "ok" : "malo";

export const tonoNivelRiesgo = (n: NivelRiesgo | null): TonoBadge => {
  switch (n) {
    case "Bajo":
      return "ok";
    case "Medio":
      return "aviso";
    case "Alto":
      return "malo";
    case null:
      return "neutro";
  }
};
