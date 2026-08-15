/**
 * Configuracion derivada de las variables `VITE_*`.
 *
 * Recordatorio: todo lo que lleve el prefijo `VITE_` acaba en el bundle
 * publico. Aqui no puede haber ningun secreto (frontend-seguridad.md §8.3).
 */

function urlApi(): string {
  const bruta: unknown = import.meta.env.VITE_API_URL;

  if (typeof bruta === "string" && bruta.trim() !== "") {
    // Sin barra final: las rutas del cliente siempre empiezan por "/".
    return bruta.trim().replace(/\/+$/, "");
  }

  if (import.meta.env.PROD) {
    // Fallo rapido y ruidoso: es un error de despliegue, no un caso a tolerar.
    throw new Error(
      "VITE_API_URL no esta definida. El build de produccion no puede continuar.",
    );
  }

  return "http://localhost:3001";
}

export const entorno = {
  apiUrl: urlApi(),
  esProduccion: import.meta.env.PROD,
  /** Tope de espera de una peticion HTTP antes de abortarla. */
  timeoutMs: 15_000,
} as const;
