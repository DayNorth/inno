import { cerrarSesionEnServidor } from "./authApi";
import { anunciarCierre, type MotivoCierre } from "./canalSesion";
import { permitirRehidratar } from "./refresco";
import { limpiarSesionLocal } from "./sesion";

/**
 * Cierre de sesion completo.
 *
 * Orden deliberado: primero se revoca en el servidor (mientras el token aun
 * sirve), despues se borra todo lo local y por ultimo se avisa a las demas
 * pestanas. El cierre local ocurre aunque la llamada de red falle.
 */
export async function cerrarSesion(
  motivo: MotivoCierre = "manual",
): Promise<void> {
  await cerrarSesionEnServidor();
  limpiarSesionLocal();
  permitirRehidratar();
  anunciarCierre(motivo);
}

/**
 * Cierre local, sin llamada de red ni anuncio.
 * Es lo que ejecuta la pestana que RECIBE el aviso de otra: re-emitirlo crearia
 * un bucle entre pestanas.
 */
export function cerrarSesionLocalmente(): void {
  limpiarSesionLocal();
  permitirRehidratar();
}
