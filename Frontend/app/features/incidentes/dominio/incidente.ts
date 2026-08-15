import * as v from "@/shared/verificar/primitivas";
import {
  idIncidente,
  idPlataforma,
  idUsuario,
  type IdIncidente,
  type IdPlataforma,
  type IdUsuario,
} from "@/shared/tipos/marca";

export const ESTADOS_INCIDENTE = ["Abierto", "Resuelto"] as const;
export type EstadoIncidente = (typeof ESTADOS_INCIDENTE)[number];

export const LARGOS_INCIDENTE = {
  titulo: 150,
  procedimiento_alterno: 500,
} as const;

export interface Incidente {
  readonly id_incidente: IdIncidente;
  readonly id_plataforma: IdPlataforma;
  readonly plataforma: string;
  readonly id_usuario_responsable: IdUsuario;
  readonly responsable: string;
  readonly titulo: string;
  /** `datetime`: la hora es un dato real, no un artefacto de huso horario. */
  readonly fecha_inicio: string;
  readonly fecha_resolucion: string | null;
  readonly procedimiento_alterno: string | null;
  readonly estado: EstadoIncidente;
}

export function aIncidente(x: unknown, ruta = "incidente"): Incidente {
  const o = v.objeto(x, ruta);
  return {
    id_incidente: idIncidente(v.entero(o.id_incidente, `${ruta}.id_incidente`)),
    id_plataforma: idPlataforma(
      v.entero(o.id_plataforma, `${ruta}.id_plataforma`),
    ),
    plataforma: v.texto(o.plataforma, `${ruta}.plataforma`),
    id_usuario_responsable: idUsuario(
      v.entero(o.id_usuario_responsable, `${ruta}.id_usuario_responsable`),
    ),
    responsable: v.texto(o.responsable, `${ruta}.responsable`),
    titulo: v.texto(o.titulo, `${ruta}.titulo`),
    fecha_inicio: v.fechaIso(o.fecha_inicio, `${ruta}.fecha_inicio`),
    fecha_resolucion: v.fechaIsoNulable(
      o.fecha_resolucion,
      `${ruta}.fecha_resolucion`,
    ),
    procedimiento_alterno: v.textoNulable(
      o.procedimiento_alterno,
      `${ruta}.procedimiento_alterno`,
    ),
    estado: v.literal(o.estado, ESTADOS_INCIDENTE, `${ruta}.estado`),
  };
}

export const aListaIncidentes = (x: unknown): Incidente[] =>
  v.lista(x, "incidentes", aIncidente);

export interface DatosIncidente {
  readonly id_plataforma: number;
  readonly id_usuario_responsable: number;
  readonly titulo: string;
  readonly fecha_inicio: string;
  readonly procedimiento_alterno: string | null;
}
