import { useMemo, useState } from "react";

/**
 * Filtro de texto en cliente para las tablas de lista. No hay backend de
 * busqueda en el contrato: esto filtra sobre los datos ya cargados, no
 * sustituye paginacion ni busqueda de servidor.
 */
export function useFiltroTabla<T>(
  items: readonly T[],
  camposTexto: (item: T) => readonly (string | number | null | undefined)[],
) {
  const [filtro, setFiltro] = useState("");

  const resultado = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (q === "") return items;
    return items.filter((item) =>
      camposTexto(item).some(
        (campo) => campo !== null && campo !== undefined && String(campo).toLowerCase().includes(q),
      ),
    );
  }, [items, filtro, camposTexto]);

  return { filtro, setFiltro, resultado } as const;
}
