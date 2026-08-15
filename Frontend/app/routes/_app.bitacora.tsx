import { useMemo, useState } from "react";
import type { Route } from "./+types/_app.bitacora";
import { requerirRol } from "@/shared/auth/requerir";
import { ROLES_BITACORA } from "@/shared/tipos/rol";
import { EncabezadoPagina } from "@/shared/ui/EncabezadoPagina/EncabezadoPagina";
import { EstadoVacio } from "@/shared/ui/EstadoVacio/EstadoVacio";
import { PanelTabla, t, Tabla } from "@/shared/ui/Tabla/Tabla";
import { ToolbarTabla } from "@/shared/ui/Tabla/ToolbarTabla";
import { cx } from "@/shared/utils/cx";
import { formatearFechaHora } from "@/shared/utils/formato";
import { listarBitacora } from "@/features/bitacora/api/bitacoraApi";
import { filtrarBitacora } from "@/features/bitacora/dominio/bitacora";

export function meta() {
  return [{ title: "Bitacora · VinkaPlant" }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  // Excepcion de rol: Administrador y Auditor. El Operador queda fuera.
  await requerirRol(ROLES_BITACORA, request);
  return { entradas: await listarBitacora(request.signal) };
}

export default function Bitacora({ loaderData }: Route.ComponentProps) {
  const [filtro, setFiltro] = useState("");
  const visibles = useMemo(
    () => filtrarBitacora(loaderData.entradas, filtro),
    [loaderData.entradas, filtro],
  );

  return (
    <>
      <EncabezadoPagina
        titulo="Bitacora"
        subtitulo="Registro de auditoria del sistema. Solo lectura."
      />

      <ToolbarTabla
        filtro={filtro}
        onFiltroChange={setFiltro}
        etiquetaBusqueda="Filtrar por usuario o accion"
        mostrando={visibles.length}
        total={loaderData.entradas.length}
      />

      {visibles.length === 0 ? (
        <EstadoVacio
          titulo="Sin entradas"
          detalle={
            filtro === ""
              ? "La bitacora todavia no tiene registros."
              : "Ningun registro coincide con el filtro."
          }
        />
      ) : (
        <PanelTabla aviso="El endpoint no pagina: devuelve la tabla completa. El filtro se aplica en el navegador.">
          <Tabla etiqueta="Bitacora" filasDiferidas>
            <colgroup>
              <col className={t.ancho6} />
              <col className={t.ancho11} />
              <col className={t.ancho12} />
              <col className={t.flexible} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col" className={cx(t.colId, t.p2)}>
                  ID
                </th>
                <th scope="col" className={t.colFecha}>
                  Fecha
                </th>
                <th scope="col">Usuario</th>
                <th scope="col">Accion</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((e) => (
                <tr key={e.id_bitacora}>
                  <td className={cx(t.colId, t.p2)}>{e.id_bitacora}</td>
                  <td className={t.colFecha}>{formatearFechaHora(e.fecha)}</td>
                  <td>{e.usuario}</td>
                  <td>{e.accion}</td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        </PanelTabla>
      )}
    </>
  );
}
