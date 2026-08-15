import type { ReactNode } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from "react-router";
import { rehidratarSesion } from "@/shared/auth/refresco";
import { logger } from "@/shared/observabilidad/logger";
import { Cargando } from "@/shared/ui/Cargando/Cargando";
import { LimiteDeError } from "@/shared/ui/LimiteDeError/LimiteDeError";

import "./estilos/tokens.css";
import "./estilos/fuentes.css";
import "./estilos/reset.css";
import "./estilos/global.css";
import "./estilos/tailwind.css";

export function Layout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/*
          La CSP real es un header HTTP del host de estaticos (deploy/nginx.conf):
          `frame-ancestors` y `X-Frame-Options` se IGNORAN en un <meta>. Aqui solo
          van los complementarios que si funcionan como meta.
        */}
        <meta name="referrer" content="no-referrer" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

/**
 * Rehidratacion de sesion: UN solo intento de refresh silencioso antes de que
 * corra ningun loader hijo. Elimina por completo la carrera "el guard redirige
 * a /login antes de que termine el refresh".
 */
export async function clientLoader() {
  logger.debug("Rehidratando sesion antes de que corra ningun loader hijo");
  await rehidratarSesion();
  return null;
}
clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <Cargando mensaje="Restaurando sesion…" pantallaCompleta />;
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary() {
  return <LimiteDeError error={useRouteError()} />;
}
