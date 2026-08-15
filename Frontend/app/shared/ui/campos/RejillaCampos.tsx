import type { ReactNode } from "react";
import "./Campo.css";

/**
 * Rejilla `auto-fit` + `minmax()`: el numero de columnas baja solo cuando los
 * campos no caben, sin un solo `@media`. Ver frontend-ui.md §4.1.
 */
export function RejillaCampos({ children }: { readonly children: ReactNode }) {
  return <div className="rejilla-campos">{children}</div>;
}
