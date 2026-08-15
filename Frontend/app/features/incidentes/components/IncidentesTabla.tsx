import { Badge } from "@/shared/ui/Badge/Badge";
import { Boton } from "@/shared/ui/Boton/Boton";
import { PanelTabla, t, Tabla } from "@/shared/ui/Tabla/Tabla";
import { cx } from "@/shared/utils/cx";
import { formatearFechaHora } from "@/shared/utils/formato";
import type { Incidente } from "../dominio/incidente";

interface Props {
  readonly incidentes: readonly Incidente[];
  readonly puedeResolver: boolean;
  readonly ocupado: boolean;
  readonly onResolver: (i: Incidente) => void;
}

export function IncidentesTabla({
  incidentes,
  puedeResolver,
  ocupado,
  onResolver,
}: Props) {
  return (
    <PanelTabla>
      <Tabla etiqueta="Incidentes">
        <colgroup>
          <col className={t.ancho5} />
          <col className={t.flexible} />
          <col className={t.ancho10} />
          <col className={t.ancho11} />
          <col className={t.ancho10} />
          <col className={t.ancho10} />
          <col className={t.ancho7} />
          {puedeResolver && <col className={t.ancho8} />}
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className={t.colId}>
              ID
            </th>
            <th scope="col">Titulo</th>
            <th scope="col">Plataforma</th>
            <th scope="col" className={t.p2}>
              Responsable
            </th>
            {/* `datetime`: la hora es legitima, excepcion a §5.4 de la UI. */}
            <th scope="col" className={cx(t.colFecha, t.p2)}>
              Inicio
            </th>
            <th scope="col" className={cx(t.colFecha, t.p3)}>
              Resolucion
            </th>
            <th scope="col" className={t.colEstado}>
              Estado
            </th>
            {puedeResolver && (
              <th scope="col" className={t.colAcciones}>
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {incidentes.map((i) => (
            <tr key={i.id_incidente}>
              <td className={t.colId}>{i.id_incidente}</td>
              <td>{i.titulo}</td>
              <td>{i.plataforma}</td>
              <td className={t.p2}>{i.responsable}</td>
              <td className={cx(t.colFecha, t.p2)}>
                {formatearFechaHora(i.fecha_inicio)}
              </td>
              <td className={cx(t.colFecha, t.p3)}>
                {formatearFechaHora(i.fecha_resolucion)}
              </td>
              <td className={t.colEstado}>
                <Badge tono={i.estado === "Abierto" ? "aviso" : "ok"}>
                  {i.estado}
                </Badge>
              </td>
              {puedeResolver && (
                <td className={t.colAcciones}>
                  {i.estado === "Abierto" && (
                    <Boton
                      pequeno
                      disabled={ocupado}
                      onClick={() => {
                        onResolver(i);
                      }}
                    >
                      Resolver
                    </Boton>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </Tabla>
    </PanelTabla>
  );
}
