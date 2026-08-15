import type { ReactNode } from "react";

/** Fila de botones al pie de un dialogo. */
export function AccionesModal({ children }: { readonly children: ReactNode }) {
  return (
    <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-line-soft pt-4">
      {children}
    </div>
  );
}
