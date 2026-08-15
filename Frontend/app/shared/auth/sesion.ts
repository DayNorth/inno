/**
 * Estado de sesion de la aplicacion.
 *
 * Vive fuera de React (variable de modulo) porque los guards corren en los
 * `clientLoader`, antes de que exista ningun componente. Los componentes se
 * suscriben con `useSesion()` via `useSyncExternalStore`.
 *
 * El token NO esta aqui: vive en `shared/api/almacenToken`, al que solo accede
 * `shared/api/cliente.ts`.
 */
import { useSyncExternalStore } from "react";
import {
  establecerAccessToken,
  olvidarAccessToken,
  registrarPerdidaDeSesion,
} from "@/shared/api/cliente";
import { limpiarCache } from "@/shared/api/cacheTTL";
import type { IdRol } from "@/shared/tipos/rol";
import type { IdUsuario } from "@/shared/tipos/marca";

export interface UsuarioSesion {
  readonly id_usuario: IdUsuario;
  readonly correo: string;
  readonly id_rol: IdRol;
  readonly rol: string;
  /**
   * `null` tras rehidratar: el access token no incluye `nombre` y no existe
   * endpoint `/me` (contrato-api.md §1.2). Solo llega en el login completo.
   */
  readonly nombre: string | null;
}

let usuario: UsuarioSesion | null = null;
const suscriptores = new Set<() => void>();

function notificar(): void {
  for (const s of suscriptores) s();
}

function suscribir(escucha: () => void): () => void {
  suscriptores.add(escucha);
  return () => {
    suscriptores.delete(escucha);
  };
}

/** Lectura sincrona, para loaders y guards. */
export function sesionActual(): UsuarioSesion | null {
  return usuario;
}

/** Lectura reactiva, para componentes. */
export function useSesion(): UsuarioSesion | null {
  return useSyncExternalStore(suscribir, sesionActual, sesionActual);
}

/**
 * Hook para pantallas dentro del layout protegido, donde el guard del loader
 * ya garantizo que hay sesion.
 */
export function useSesionRequerida(): UsuarioSesion {
  const actual = useSesion();
  if (actual === null) {
    throw new Error("useSesionRequerida fuera del layout protegido");
  }
  return actual;
}

export function establecerSesion(nuevo: UsuarioSesion, token: string): void {
  establecerAccessToken(token);
  usuario = nuevo;
  notificar();
}

/**
 * Borra todo rastro local de la sesion.
 * `limpiarCache()` no es opcional: ningun dato de una sesion puede sobrevivir
 * a la siguiente (frontend-seguridad.md §4).
 */
export function limpiarSesionLocal(): void {
  olvidarAccessToken();
  limpiarCache();
  usuario = null;
  notificar();
}

// La capa de red avisa cuando la renovacion falla: la sesion se cae sola.
registrarPerdidaDeSesion(limpiarSesionLocal);
