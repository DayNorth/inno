import { isRouteErrorResponse, Link } from "react-router";
import { ApiError } from "@/shared/api/ApiError";
import { logger } from "@/shared/observabilidad/logger";
import { RUTAS } from "@/rutas";

interface Props {
  readonly error: unknown;
}

interface Presentacion {
  readonly titulo: string;
  readonly texto: string;
}

function presentar(error: unknown): Presentacion {
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return {
        titulo: "Pagina no encontrada",
        texto: "La direccion no existe o el registro fue eliminado.",
      };
    }
    return {
      titulo: "No se pudo cargar la pagina",
      texto: "La operacion no se pudo completar. Intenta de nuevo.",
    };
  }

  if (error instanceof ApiError) {
    if (error.esSinPermiso) {
      return {
        titulo: "Sin permiso",
        texto: "Tu rol no tiene acceso a esta informacion.",
      };
    }
    // El mensaje del backend viene redactado para el usuario final y no
    // filtra detalle interno (contrato-api.md §12.2).
    return { titulo: "No se pudo completar la operacion", texto: error.message };
  }

  return {
    titulo: "Algo salio mal",
    texto: "No se pudo completar la operacion. Intenta de nuevo.",
  };
}

/**
 * Error boundary que no filtra.
 *
 * En produccion NUNCA se renderiza el stack, ni la URL de la peticion, ni el
 * cuerpo de la respuesta: cualquiera de los tres puede contener PII. El detalle
 * va al logger, que ya depura claves sensibles.
 */
export function LimiteDeError({ error }: Props) {
  const esProd = import.meta.env.PROD;
  const correlationId = error instanceof ApiError ? error.correlationId : undefined;
  const { titulo, texto } = presentar(error);

  logger.error("Error no controlado en la interfaz", {
    tipo: error instanceof Error ? error.name : typeof error,
    correlationId,
  });

  return (
    <section
      className="mx-auto my-12 max-w-[42rem] rounded-lg border border-line-soft bg-paper-raised p-8 shadow-1"
      role="alert"
    >
      <h2 className="mb-3 font-titulos text-xl">{titulo}</h2>
      <p className="text-ink-soft">{texto}</p>

      {correlationId !== undefined && (
        <p className="mt-4 text-sm text-ink-soft">
          Referencia para soporte: <code>{correlationId}</code>
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <Link to={RUTAS.inicio}>Volver al inicio</Link>
      </div>

      {!esProd && (
        <pre className="mt-6 overflow-x-auto whitespace-pre-wrap rounded-md bg-paper-sutil p-3 font-mono text-xs text-ink-soft">
          {String(error)}
        </pre>
      )}
    </section>
  );
}
