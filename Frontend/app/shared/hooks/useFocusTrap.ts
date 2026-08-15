import { useEffect, type RefObject } from "react";

const SELECTOR_FOCALIZABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function focalizables(raiz: HTMLElement): HTMLElement[] {
  return Array.from(
    raiz.querySelectorAll<HTMLElement>(SELECTOR_FOCALIZABLE),
  ).filter((el) => el.offsetParent !== null || el === document.activeElement);
}

/**
 * Encierra el foco dentro de `contenedor` mientras `activo`.
 *
 * Al desmontar devuelve el foco al elemento que abrio el dialogo, que es el
 * requisito de WCAG 2.4.3 que mas se olvida.
 */
export function useFocusTrap(
  contenedor: RefObject<HTMLElement | null>,
  activo: boolean,
): void {
  useEffect(() => {
    if (!activo) return;
    const raiz = contenedor.current;
    if (raiz === null) return;

    const anterior =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const primeros = focalizables(raiz);
    (primeros[0] ?? raiz).focus();

    function alPulsar(e: KeyboardEvent): void {
      if (e.key !== "Tab" || raiz === null) return;

      const items = focalizables(raiz);
      const primero = items[0];
      const ultimo = items[items.length - 1];
      if (primero === undefined || ultimo === undefined) {
        e.preventDefault();
        return;
      }

      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener("keydown", alPulsar, true);
    return () => {
      document.removeEventListener("keydown", alPulsar, true);
      anterior?.focus();
    };
  }, [contenedor, activo]);
}
