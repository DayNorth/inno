import * as v from "@/shared/verificar/primitivas";
import {
  idAcceso,
  idPlataforma,
  idUsuario,
  type IdAcceso,
  type IdPlataforma,
  type IdUsuario,
} from "@/shared/tipos/marca";

export const ESTADOS_ACCESO = ["Vigente", "Revocado"] as const;
export type EstadoAcceso = (typeof ESTADOS_ACCESO)[number];

export const LARGOS_ACCESO = { rol_acceso: 100 } as const;

export interface Acceso {
  readonly id_acceso: IdAcceso;
  readonly id_usuario: IdUsuario;
  readonly usuario: string;
  readonly id_plataforma: IdPlataforma;
  readonly plataforma: string;
  readonly rol_acceso: string;
  readonly fecha_alta: string;
  readonly fecha_ultima_revision: string | null;
  readonly estado: EstadoAcceso;
}

export function aAcceso(x: unknown, ruta = "acceso"): Acceso {
  const o = v.objeto(x, ruta);
  return {
    id_acceso: idAcceso(v.entero(o.id_acceso, `${ruta}.id_acceso`)),
    id_usuario: idUsuario(v.entero(o.id_usuario, `${ruta}.id_usuario`)),
    usuario: v.texto(o.usuario, `${ruta}.usuario`),
    id_plataforma: idPlataforma(
      v.entero(o.id_plataforma, `${ruta}.id_plataforma`),
    ),
    plataforma: v.texto(o.plataforma, `${ruta}.plataforma`),
    rol_acceso: v.texto(o.rol_acceso, `${ruta}.rol_acceso`),
    fecha_alta: v.fechaIso(o.fecha_alta, `${ruta}.fecha_alta`),
    fecha_ultima_revision: v.fechaIsoNulable(
      o.fecha_ultima_revision,
      `${ruta}.fecha_ultima_revision`,
    ),
    estado: v.literal(o.estado, ESTADOS_ACCESO, `${ruta}.estado`),
  };
}

export const aListaAccesos = (x: unknown): Acceso[] =>
  v.lista(x, "accesos", aAcceso);

/**
 * Roles de acceso ya registrados, para sugerirlos en el alta.
 *
 * El contrato no expone catalogo: `rol_acceso` es texto libre (varchar 100).
 * Derivarlos de los propios accesos mantiene la lista al dia sin inventar un
 * endpoint, y sin impedir registrar un rol que todavia no exista.
 */
export function rolesDeAccesoUsados(accesos: readonly Acceso[]): string[] {
  const vistos = new Set<string>();
  for (const a of accesos) {
    const limpio = a.rol_acceso.trim();
    if (limpio !== "") vistos.add(limpio);
  }
  return [...vistos].sort((a, b) => a.localeCompare(b, "es"));
}

export interface DatosAcceso {
  readonly id_usuario: number;
  readonly id_plataforma: number;
  readonly rol_acceso: string;
  readonly fecha_alta: string;
}
