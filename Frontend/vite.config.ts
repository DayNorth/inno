import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";

/**
 * CSP relajada SOLO en desarrollo: Vite necesita scripts inline y un websocket
 * para el HMR. La politica estricta de produccion se sirve como header HTTP
 * desde el host de estaticos (ver deploy/nginx.conf y docs/frontend-seguridad.md).
 */
const CSP_DESARROLLO = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self' ws: http://localhost:3001",
  "img-src 'self' data:",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
].join("; ");

const CABECERAS_DESARROLLO: Readonly<Record<string, string>> = {
  "Content-Security-Policy": CSP_DESARROLLO,
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

/**
 * Aplica las cabeceras a TODA respuesta del servidor de desarrollo.
 *
 * `server.headers` no basta: el documento HTML lo genera el middleware de React
 * Router, que no pasa por el camino donde Vite las inyecta. Con un middleware
 * propio, lo que se prueba en local es de verdad una CSP.
 */
function cabecerasDeSeguridad(): Plugin {
  return {
    name: "vinkaplant-cabeceras-seguridad",
    configureServer(servidor) {
      servidor.middlewares.use((_peticion, respuesta, siguiente) => {
        for (const [nombre, valor] of Object.entries(CABECERAS_DESARROLLO)) {
          respuesta.setHeader(nombre, valor);
        }
        siguiente();
      });
    },
  };
}

export default defineConfig({
  plugins: [cabecerasDeSeguridad(), tailwindcss(), reactRouter()],
  // Alias "@/..." resueltos desde tsconfig.json, sin plugin de terceros.
  resolve: { tsconfigPaths: true },
  server: {
    port: 5173,
    headers: CABECERAS_DESARROLLO,
  },
  build: {
    // Los sourcemaps publicarian el codigo original en produccion.
    sourcemap: false,
  },
});
