import { pedir } from "@/shared/api/cliente";
import * as v from "@/shared/verificar/primitivas";
import type { IdPermiso } from "@/shared/tipos/marca";
import type { IdRol } from "@/shared/tipos/rol";
import { aListaPermisos, aMatriz, type Permiso, type AsignacionRolPermiso } from "../dominio/permiso";

export const listarPermisos = (signal?: AbortSignal): Promise<Permiso[]> =>
  pedir("/api/permisos", aListaPermisos, { signal });

export const listarMatriz = (
  signal?: AbortSignal,
): Promise<AsignacionRolPermiso[]> =>
  pedir("/api/permisos/matriz", aMatriz, { signal });

export const asignarPermiso = (
  idRol: IdRol,
  idPermiso: IdPermiso,
): Promise<string> =>
  pedir(`/api/permisos/roles/${idRol}`, v.mensaje, {
    metodo: "POST",
    cuerpo: { id_permiso: idPermiso },
  });

export const revocarPermiso = (
  idRol: IdRol,
  idPermiso: IdPermiso,
): Promise<string> =>
  pedir(`/api/permisos/roles/${idRol}/${idPermiso}`, v.mensaje, {
    metodo: "DELETE",
  });
