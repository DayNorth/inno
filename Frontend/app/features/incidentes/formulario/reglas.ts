import {
  fechaObligatoria,
  largoMaximo,
  obligatorio,
  opcional,
  recortado,
  seleccionObligatoria,
  type Reglas,
} from "@/shared/formularios/tipos";
import { hoyIso } from "@/shared/utils/formato";
import { LARGOS_INCIDENTE, type DatosIncidente } from "../dominio/incidente";

export interface IncidenteForm {
  id_plataforma: number | null;
  id_usuario_responsable: number | null;
  titulo: string;
  fecha_inicio: string;
  procedimiento_alterno: string;
}

export const reglasIncidente = {
  id_plataforma: seleccionObligatoria("una plataforma valida"),
  id_usuario_responsable: seleccionObligatoria("un responsable valido"),
  titulo: {
    ...obligatorio("El titulo del incidente"),
    ...largoMaximo(LARGOS_INCIDENTE.titulo),
  },
  fecha_inicio: fechaObligatoria("La fecha de inicio"),
  procedimiento_alterno: largoMaximo(LARGOS_INCIDENTE.procedimiento_alterno),
} satisfies Reglas<IncidenteForm>;

export const valoresInicialesIncidente = (): IncidenteForm => ({
  id_plataforma: null,
  id_usuario_responsable: null,
  titulo: "",
  fecha_inicio: hoyIso(),
  procedimiento_alterno: "",
});

export const aPayloadIncidente = (f: IncidenteForm): DatosIncidente => ({
  id_plataforma: f.id_plataforma ?? 0,
  id_usuario_responsable: f.id_usuario_responsable ?? 0,
  titulo: recortado(f.titulo),
  fecha_inicio: f.fecha_inicio,
  procedimiento_alterno: opcional(f.procedimiento_alterno),
});

export interface ResolucionForm {
  fecha_resolucion: string;
}

/**
 * Validacion cruzada: la resolucion no puede ser anterior al inicio.
 * Es el caso que un `.refine()` de esquema haria mas corto; con RHF nativo se
 * escribe como `validate` con la fecha de inicio capturada en el closure.
 */
export const reglasResolucion = (fechaInicio: string) =>
  ({
    fecha_resolucion: {
      validate: (v: unknown): string | true => {
        if (typeof v !== "string" || v === "") return true; // vacio => ahora
        const resolucion = new Date(v).getTime();
        if (Number.isNaN(resolucion)) return "La fecha de resolucion no es valida";
        const inicio = new Date(fechaInicio).getTime();
        if (Number.isNaN(inicio)) return true;
        return (
          resolucion >= inicio ||
          "La resolucion no puede ser anterior al inicio del incidente"
        );
      },
    },
  }) satisfies Reglas<ResolucionForm>;
