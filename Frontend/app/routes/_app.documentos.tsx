import type { Route } from "./+types/_app.documentos";
import { requerirSesion } from "@/shared/auth/requerir";
import { Alert } from "@/shared/ui/Alert/Alert";
import { EncabezadoPagina } from "@/shared/ui/EncabezadoPagina/EncabezadoPagina";
import { EstadoVacio } from "@/shared/ui/EstadoVacio/EstadoVacio";

export function meta() {
  return [{ title: "Documentos · VinkaPlant" }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  await requerirSesion(request);
  return null;
}

/**
 * Pantalla pendiente a proposito.
 *
 * Las tablas `Documentos` / `TiposDocumento` y la carpeta `uploads` existen en
 * el backend, pero NO hay endpoints montados (contrato-api.md §10.5). Sin
 * contrato no hay nada que implementar; inventarlo seria adivinar.
 */
export default function Documentos() {
  return (
    <>
      <EncabezadoPagina
        titulo="Documentos"
        subtitulo="Gestion documental de VinkaPlant."
      />
      <Alert tono="info">
        El backend todavia no expone endpoints para esta seccion.
      </Alert>
      <EstadoVacio
        titulo="Seccion no disponible"
        detalle="Se habilitara cuando el contrato de la API incluya /api/documentos."
      />
    </>
  );
}
