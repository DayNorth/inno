import * as v from "@/shared/verificar/primitivas";
import {
  idDispositivo,
  idUsuario,
  type IdDispositivo,
  type IdUsuario,
} from "@/shared/tipos/marca";

export const ESTADOS_SEGURIDAD = ["Cumple", "No cumple"] as const;
export type EstadoSeguridad = (typeof ESTADOS_SEGURIDAD)[number];

export const LARGOS_DISPOSITIVO = {
  codigo_equipo: 30,
  tipo_dispositivo: 50,
  sistema_operativo: 100,
} as const;

export interface Dispositivo {
  readonly id_dispositivo: IdDispositivo;
  readonly id_usuario: IdUsuario;
  readonly responsable: string;
  readonly codigo_equipo: string;
  readonly tipo_dispositivo: string;
  readonly sistema_operativo: string | null;
  readonly antivirus_activo: boolean;
  readonly fecha_ultima_actualizacion: string | null;
  readonly tiene_ups: boolean;
  readonly estado_seguridad: EstadoSeguridad;
}

export function aDispositivo(x: unknown, ruta = "dispositivo"): Dispositivo {
  const o = v.objeto(x, ruta);
  return {
    id_dispositivo: idDispositivo(
      v.entero(o.id_dispositivo, `${ruta}.id_dispositivo`),
    ),
    id_usuario: idUsuario(v.entero(o.id_usuario, `${ruta}.id_usuario`)),
    responsable: v.texto(o.responsable, `${ruta}.responsable`),
    codigo_equipo: v.texto(o.codigo_equipo, `${ruta}.codigo_equipo`),
    tipo_dispositivo: v.texto(o.tipo_dispositivo, `${ruta}.tipo_dispositivo`),
    sistema_operativo: v.textoNulable(
      o.sistema_operativo,
      `${ruta}.sistema_operativo`,
    ),
    antivirus_activo: v.booleano(o.antivirus_activo, `${ruta}.antivirus_activo`),
    fecha_ultima_actualizacion: v.fechaIsoNulable(
      o.fecha_ultima_actualizacion,
      `${ruta}.fecha_ultima_actualizacion`,
    ),
    tiene_ups: v.booleano(o.tiene_ups, `${ruta}.tiene_ups`),
    estado_seguridad: v.literal(
      o.estado_seguridad,
      ESTADOS_SEGURIDAD,
      `${ruta}.estado_seguridad`,
    ),
  };
}

export const aListaDispositivos = (x: unknown): Dispositivo[] =>
  v.lista(x, "dispositivos", aDispositivo);

export interface DatosDispositivo {
  readonly id_usuario: number;
  readonly codigo_equipo: string;
  readonly tipo_dispositivo: string;
  readonly sistema_operativo: string | null;
  readonly antivirus_activo: boolean;
  readonly fecha_ultima_actualizacion: string | null;
  readonly tiene_ups: boolean;
}

/**
 * Regla de negocio del backend, replicada solo para PREVISUALIZAR.
 * `estado_seguridad` no se envia: lo calcula el servicio (contrato-api.md §7.3).
 */
export const estadoSeguridadPrevisto = (
  antivirus: boolean,
  ups: boolean,
): EstadoSeguridad => (antivirus && ups ? "Cumple" : "No cumple");
