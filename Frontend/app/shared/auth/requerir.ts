import { redirect } from "react-router";
import { RUTAS } from "@/rutas";
import type { IdRol } from "@/shared/tipos/rol";
import { rehidratarSesion } from "./refresco";
import { sesionActual, type UsuarioSesion } from "./sesion";
import { urlDeLoginDesde } from "./redireccion";

/**
 * Corta la carga de la ruta si no hay sesion. Devuelve el usuario, ya no-nulo.
 *
 * ESPERA a la rehidratacion antes de decidir. No es un detalle: los loaders
 * anidados de React Router corren en paralelo, asi que el del root no ha
 * terminado su refresh silencioso cuando este guard se ejecuta. Sin el `await`,
 * cada F5 acaba en /login aunque la cookie de refresh sea perfectamente valida.
 *
 * Al lanzarse desde un `clientLoader`, la peticion de datos de una ruta
 * prohibida nunca llega a dispararse.
 */
export async function requerirSesion(peticion?: Request): Promise<UsuarioSesion> {
  await rehidratarSesion();

  const usuario = sesionActual();
  if (usuario === null) {
    throw redirect(destinoDeLogin(peticion));
  }
  return usuario;
}

function destinoDeLogin(peticion: Request | undefined): string {
  if (peticion === undefined) return RUTAS.login;
  const url = new URL(peticion.url);
  return urlDeLoginDesde(url.pathname + url.search);
}

/**
 * Exige uno de los roles indicados.
 *
 * ESTO ES CONTROL DE INTERFAZ, NO DE SEGURIDAD. Los claims del token se leen
 * sin verificar la firma; quien manipule el token en memoria puede llegar a la
 * pantalla, y el backend le devolvera 403. Los dos controles coexisten a
 * proposito (contrato-api.md §11).
 */
export async function requerirRol(
  permitidos: readonly IdRol[],
  peticion?: Request,
): Promise<UsuarioSesion> {
  const usuario = await requerirSesion(peticion);
  if (!permitidos.includes(usuario.id_rol)) {
    throw redirect(`${RUTAS.inicio}?sinPermiso=1`);
  }
  return usuario;
}
