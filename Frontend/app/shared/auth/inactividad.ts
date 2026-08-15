/**
 * Vigilancia de inactividad y tope absoluto (frontend-seguridad.md §6.2).
 *
 * LIMITE HONESTO: un timeout en el cliente no es una frontera frente a quien ya
 * tiene la cookie de refresh —esa cookie sigue siendo valida 7 dias segun el
 * backend—. Lo que si mitiga, y es un riesgo real en una oficina, es la
 * estacion desatendida.
 */
import type { MotivoCierre } from "./canalSesion";

export const INACTIVIDAD_MS = 15 * 60_000;
export const TOPE_ABSOLUTO_MS = 8 * 60 * 60_000;
export const AVISO_MS = 60_000;
const PERIODO_REVISION_MS = 10_000;

const EVENTOS = ["pointerdown", "keydown", "scroll", "focus"] as const;

interface Manejadores {
  readonly avisar: () => void;
  readonly cancelarAviso: () => void;
  readonly cerrar: (motivo: MotivoCierre) => void;
}

/**
 * Compara MARCAS DE TIEMPO en un intervalo corto en vez de fiarse de un
 * `setTimeout` largo: el navegador estrangula los timers en pestanas de fondo y
 * un temporizador de 15 min puede dispararse tarde o no dispararse. Con
 * timestamps, volver a la pestana detecta el vencimiento igualmente.
 */
export function vigilarSesion(al: Manejadores): () => void {
  const inicioSesion = Date.now();
  let ultimaActividad = Date.now();
  let avisado = false;
  let cerrado = false;

  function revisar(): void {
    if (cerrado) return;
    const ahora = Date.now();

    if (ahora - inicioSesion >= TOPE_ABSOLUTO_MS) {
      cerrado = true;
      al.cerrar("expiracion");
      return;
    }

    const inactivo = ahora - ultimaActividad;
    if (inactivo >= INACTIVIDAD_MS) {
      cerrado = true;
      al.cerrar("inactividad");
      return;
    }
    if (inactivo >= INACTIVIDAD_MS - AVISO_MS && !avisado) {
      avisado = true;
      al.avisar();
    }
  }

  function marcar(): void {
    ultimaActividad = Date.now();
    if (avisado) {
      avisado = false;
      al.cancelarAviso();
    }
  }

  for (const evento of EVENTOS) {
    window.addEventListener(evento, marcar, { passive: true });
  }
  document.addEventListener("visibilitychange", revisar);
  const intervalo = window.setInterval(revisar, PERIODO_REVISION_MS);

  return () => {
    window.clearInterval(intervalo);
    for (const evento of EVENTOS) {
      window.removeEventListener(evento, marcar);
    }
    document.removeEventListener("visibilitychange", revisar);
  };
}
