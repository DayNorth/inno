import {
  largoMaximo,
  obligatorio,
  opcional,
  recortado,
  type Reglas,
} from "@/shared/formularios/tipos";
import {
  LARGOS_PROVEEDOR,
  type CriteriosEvaluacion,
  type DatosPlan,
  type DatosProveedor,
} from "../dominio/proveedor";

// --- Alta de proveedor (incluye su evaluacion inicial) -----------------------

export interface ProveedorForm extends CriteriosEvaluacion {
  nombre_proveedor: string;
  tipo_servicio: string;
}

export const reglasProveedor = {
  nombre_proveedor: {
    ...obligatorio("El nombre del proveedor"),
    ...largoMaximo(LARGOS_PROVEEDOR.nombre_proveedor),
  },
  tipo_servicio: largoMaximo(LARGOS_PROVEEDOR.tipo_servicio),
} satisfies Reglas<ProveedorForm>;

export const valoresInicialesProveedor: ProveedorForm = {
  nombre_proveedor: "",
  tipo_servicio: "",
  cifrado_datos: false,
  mfa_disponible: false,
  sla_definido: false,
  certificaciones_vigentes: false,
};

export const aPayloadProveedor = (f: ProveedorForm): DatosProveedor => ({
  nombre_proveedor: recortado(f.nombre_proveedor),
  tipo_servicio: opcional(f.tipo_servicio),
  cifrado_datos: f.cifrado_datos,
  mfa_disponible: f.mfa_disponible,
  sla_definido: f.sla_definido,
  certificaciones_vigentes: f.certificaciones_vigentes,
});

// --- Nueva evaluacion de un proveedor existente ------------------------------

export type EvaluacionForm = CriteriosEvaluacion;

export const valoresInicialesEvaluacion: EvaluacionForm = {
  cifrado_datos: false,
  mfa_disponible: false,
  sla_definido: false,
  certificaciones_vigentes: false,
};

// --- Plan de contingencia ----------------------------------------------------

export interface PlanForm {
  escenario: string;
  procedimiento_alterno: string;
  responsable: string;
}

export const reglasPlan = {
  escenario: {
    ...obligatorio("El escenario"),
    ...largoMaximo(LARGOS_PROVEEDOR.escenario),
  },
  procedimiento_alterno: {
    ...obligatorio("El procedimiento alterno"),
    ...largoMaximo(LARGOS_PROVEEDOR.procedimiento_alterno),
  },
  responsable: largoMaximo(LARGOS_PROVEEDOR.responsable),
} satisfies Reglas<PlanForm>;

export const valoresInicialesPlan: PlanForm = {
  escenario: "",
  procedimiento_alterno: "",
  responsable: "",
};

export const aPayloadPlan = (f: PlanForm): DatosPlan => ({
  escenario: recortado(f.escenario),
  procedimiento_alterno: recortado(f.procedimiento_alterno),
  responsable: opcional(f.responsable),
});
