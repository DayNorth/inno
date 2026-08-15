import { useRouteError } from "react-router";
import type { Route } from "./+types/_app";
import { requerirSesion } from "@/shared/auth/requerir";
import { AppShell } from "@/layouts/AppShell";
import { LimiteDeError } from "@/shared/ui/LimiteDeError/LimiteDeError";

/**
 * Layout protegido.
 *
 * Los loaders anidados corren EN PARALELO, no en cascada: este guard no puede
 * dar por hecho que el root ya rehidrato la sesion, y por eso `requerirSesion`
 * espera al refresh antes de decidir. Lo que si se mantiene es que la peticion
 * de datos de una ruta prohibida acaba en `redirect` y su resultado se descarta.
 */
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  await requerirSesion(request);
  return null;
}

export default function LayoutProtegido() {
  return <AppShell />;
}

export function ErrorBoundary() {
  return <LimiteDeError error={useRouteError()} />;
}
