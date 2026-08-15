import { Badge } from "@/shared/ui/Badge/Badge";
import { PanelTabla, t, Tabla } from "@/shared/ui/Tabla/Tabla";
import { cx } from "@/shared/utils/cx";
import { formatearFecha, oGuion } from "@/shared/utils/formato";
import { criticidad, nivelDeCriticidad, type Riesgo } from "../dominio/riesgo";

export function RiesgosTabla({ riesgos }: { readonly riesgos: readonly Riesgo[] }) {
  return (
    <PanelTabla aviso="Ordenados por criticidad (probabilidad x impacto), como los devuelve el servidor.">
      <Tabla etiqueta="Riesgos">
        <colgroup>
          <col className={t.ancho5} />
          <col className={t.ancho11} />
          <col className={t.ancho9} />
          <col className={t.flexible} />
          <col className={t.ancho5} />
          <col className={t.ancho5} />
          <col className={t.ancho7} />
          <col className={t.ancho14} />
          <col className={t.ancho7} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className={t.colId}>
              ID
            </th>
            <th scope="col">Sistema</th>
            <th scope="col" className={t.p2}>
              Categoria
            </th>
            <th scope="col">Descripcion</th>
            <th scope="col" className={cx(t.colNumero, t.p2)}>
              Prob.
            </th>
            <th scope="col" className={cx(t.colNumero, t.p2)}>
              Impacto
            </th>
            <th scope="col" className={t.colEstado}>
              Criticidad
            </th>
            <th scope="col" className={t.p3}>
              Control mitigante
            </th>
            <th scope="col" className={cx(t.colFecha, t.p3)}>
              Registro
            </th>
          </tr>
        </thead>
        <tbody>
          {riesgos.map((r) => {
            const valor = criticidad(r);
            const nivel = nivelDeCriticidad(valor);
            return (
              <tr key={r.id_riesgo}>
                <td className={t.colId}>{r.id_riesgo}</td>
                <td>{r.sistema}</td>
                <td className={t.p2}>{r.categoria}</td>
                <td>{r.descripcion}</td>
                <td className={cx(t.colNumero, t.p2)}>{r.probabilidad}</td>
                <td className={cx(t.colNumero, t.p2)}>{r.impacto}</td>
                <td className={t.colEstado}>
                  <Badge tono={nivel.tono}>{`${valor} · ${nivel.etiqueta}`}</Badge>
                </td>
                <td className={t.p3}>{oGuion(r.control_mitigante)}</td>
                <td className={cx(t.colFecha, t.p3)}>
                  {formatearFecha(r.fecha_registro)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Tabla>
    </PanelTabla>
  );
}
