import { Writable } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { ServerRouter, type EntryContext } from "react-router";

/** Tope de espera del prerender, para que un fallo no cuelgue el build. */
const TIMEOUT_MS = 10_000;

/**
 * Entrada de servidor minima.
 *
 * Con `ssr: false` esto NO corre en produccion: se usa una sola vez, en el
 * build, para prerenderizar el `index.html` de la SPA. Escribirla a mano evita
 * anadir `@react-router/node` e `isbot` como dependencias de runtime solo para
 * generar un fichero estatico.
 *
 * OBLIGATORIO `renderToPipeableStream`: `<ServerRouter>` monta un `<Suspense>`
 * para transferir el estado del router, y `renderToString` no soporta Suspense.
 * Con `renderToString` el documento se emitia con el payload de hidratacion
 * convertido en un mensaje de error, el cliente nunca inicializaba y la app se
 * quedaba clavada en el `HydrateFallback`.
 *
 * `onAllReady` (y no `onShellReady`) porque un prerender necesita el HTML
 * completo, no el primer chunk.
 */
export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
): Promise<Response> {
  return new Promise((resolver, rechazar) => {
    let fallo: unknown = null;

    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        onAllReady() {
          const trozos: Buffer[] = [];
          const destino = new Writable({
            write(trozo: Buffer, _codificacion, siguiente) {
              trozos.push(Buffer.from(trozo));
              siguiente();
            },
          });

          destino.on("finish", () => {
            responseHeaders.set("Content-Type", "text/html; charset=utf-8");
            const html = Buffer.concat(trozos).toString("utf8");
            resolver(
              new Response(`<!DOCTYPE html>${html}`, {
                headers: responseHeaders,
                status: fallo === null ? responseStatusCode : 500,
              }),
            );
          });

          pipe(destino);
        },
        onShellError(error: unknown) {
          rechazar(error instanceof Error ? error : new Error(String(error)));
        },
        onError(error: unknown) {
          fallo = error;
          console.error(error);
        },
      },
    );

    setTimeout(abort, TIMEOUT_MS);
  });
}
