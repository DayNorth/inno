import {
  enteroEntre,
  largoMaximo,
  obligatoria,
  obligatorio,
  opcional,
  recortado,
  type Reglas,
} from "@/shared/formularios/tipos";
import { LARGOS_RIESGO, type DatosRiesgo } from "../dominio/riesgo";

export interface RiesgoForm {
  sistema: string;
  categoria: string;
  descripcion: string;
  /** `null` mientras el campo esta vacio: nunca `NaN`. */
  probabilidad: number | null;
  impacto: number | null;
  control_mitigante: string;
}

export const reglasRiesgo = {
  sistema: { ...obligatorio("El sistema"), ...largoMaximo(LARGOS_RIESGO.sistema) },
  categoria: {
    ...obligatoria("La categoria"),
    ...largoMaximo(LARGOS_RIESGO.categoria),
  },
  descripcion: {
    ...obligatoria("La descripcion del riesgo"),
    ...largoMaximo(LARGOS_RIESGO.descripcion),
  },
  probabilidad: enteroEntre(
    1,
    5,
    "La probabilidad debe ser un valor entre 1 y 5",
  ),
  impacto: enteroEntre(1, 5, "El impacto debe ser un valor entre 1 y 5"),
  control_mitigante: largoMaximo(LARGOS_RIESGO.control_mitigante),
} satisfies Reglas<RiesgoForm>;

export const valoresInicialesRiesgo: RiesgoForm = {
  sistema: "",
  categoria: "",
  descripcion: "",
  probabilidad: null,
  impacto: null,
  control_mitigante: "",
};

/** Se llama solo tras pasar la validacion, asi que los numeros no son nulos. */
export const aPayloadRiesgo = (f: RiesgoForm): DatosRiesgo => ({
  sistema: recortado(f.sistema),
  categoria: recortado(f.categoria),
  descripcion: recortado(f.descripcion),
  probabilidad: f.probabilidad ?? 1,
  impacto: f.impacto ?? 1,
  control_mitigante: opcional(f.control_mitigante),
});
