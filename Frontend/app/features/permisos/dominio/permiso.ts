import * as v from "@/shared/verificar/primitivas";
import { idPermiso, type IdPermiso } from "@/shared/tipos/marca";
import { esIdRol, type IdRol } from "@/shared/tipos/rol";

export interface Permiso {
  readonly id_permiso: IdPermiso;
  readonly nombre_permiso: string;
  readonly descripcion: string | null;
}

export function aPermiso(x: unknown, ruta = "permiso"): Permiso {
  const o = v.objeto(x, ruta);
  return {
    id_permiso: idPermiso(v.entero(o.id_permiso, `${ruta}.id_permiso`)),
    nombre_permiso: v.texto(o.nombre_permiso, `${ruta}.nombre_permiso`),
    descripcion: v.textoNulable(o.descripcion, `${ruta}.descripcion`),
  };
}

export const aListaPermisos = (x: unknown): Permiso[] =>
  v.lista(x, "permisos", aPermiso);

/** Una fila de la matriz: un permiso YA asignado a un rol. */
export interface AsignacionRolPermiso {
  readonly id_rol: IdRol;
  readonly rol: string;
  readonly id_permiso: IdPermiso;
  readonly nombre_permiso: string;
}

function idRol(v: number, ruta: string): IdRol {
  if (!esIdRol(v)) throw new Error(`${ruta}: rol fuera de catalogo (${v})`);
  return v;
}

export function aAsignacion(
  x: unknown,
  ruta = "asignacion",
): AsignacionRolPermiso {
  const o = v.objeto(x, ruta);
  return {
    id_rol: idRol(v.entero(o.id_rol, `${ruta}.id_rol`), `${ruta}.id_rol`),
    rol: v.texto(o.rol, `${ruta}.rol`),
    id_permiso: idPermiso(v.entero(o.id_permiso, `${ruta}.id_permiso`)),
    nombre_permiso: v.texto(o.nombre_permiso, `${ruta}.nombre_permiso`),
  };
}

export const aMatriz = (x: unknown): AsignacionRolPermiso[] =>
  v.lista(x, "matriz", aAsignacion);

/** Clave estable para comprobar "¿este rol tiene este permiso?" en un Set. */
export const claveAsignacion = (idRolValor: IdRol, idPermisoValor: IdPermiso): string =>
  `${idRolValor}:${idPermisoValor}`;
