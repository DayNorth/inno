/**
 * Error tipado de la capa de red.
 *
 * `clase` distingue los casos que la UI trata distinto sin tener que
 * interpretar el codigo HTTP en cada pantalla.
 */
export type ClaseDeError =
  | "red" // no hubo respuesta: offline, DNS, CORS
  | "timeout" // se agoto el tope de espera y se aborto
  | "http" // el servidor respondio con un codigo de error
  | "contrato" // respondio 2xx pero fuera del contrato
  | "cancelado"; // lo aborto el propio router al navegar

export class ApiError extends Error {
  readonly estado: number;
  readonly clase: ClaseDeError;
  readonly correlationId: string | undefined;

  constructor(
    mensaje: string,
    estado: number,
    clase: ClaseDeError,
    correlationId?: string,
  ) {
    super(mensaje);
    this.name = "ApiError";
    this.estado = estado;
    this.clase = clase;
    this.correlationId = correlationId;
  }

  get esNoAutenticado(): boolean {
    return this.estado === 401;
  }

  get esSinPermiso(): boolean {
    return this.estado === 403;
  }

  get esNoEncontrado(): boolean {
    return this.estado === 404;
  }

  get esConflicto(): boolean {
    return this.estado === 409;
  }
}

/**
 * Texto listo para mostrar a partir de cualquier valor lanzado.
 *
 * El backend devuelve SIEMPRE `{ mensaje }` en espanol (contrato-api.md §1.4),
 * asi que en el caso normal ya viene redactado. Lo que nunca se muestra es el
 * detalle de un error inesperado: podria filtrar informacion interna.
 */
export function mensajeDeError(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error && !import.meta.env.PROD) return e.message;
  return "Ocurrio un error inesperado. Intenta de nuevo.";
}
