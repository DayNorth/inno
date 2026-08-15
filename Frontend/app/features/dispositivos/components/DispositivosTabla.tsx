import { Badge } from "@/shared/ui/Badge/Badge";
import { SiNo } from "@/shared/ui/SiNo/SiNo";
import { PanelTabla, t, Tabla } from "@/shared/ui/Tabla/Tabla";
import { cx } from "@/shared/utils/cx";
import { formatearFecha, oGuion } from "@/shared/utils/formato";
import type { Dispositivo } from "../dominio/dispositivo";

interface Props {
  readonly dispositivos: readonly Dispositivo[];
}

export function DispositivosTabla({ dispositivos }: Props) {
  return (
    <PanelTabla>
      <Tabla etiqueta="Dispositivos">
        <colgroup>
          <col className={t.ancho5} />
          <col className={t.ancho8} />
          <col className={t.flexible} />
          <col className={t.ancho10} />
          <col className={t.ancho11} />
          <col className={t.ancho6} />
          <col className={t.ancho5} />
          <col className={t.ancho7} />
          <col className={t.ancho8} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className={t.colId}>
              ID
            </th>
            <th scope="col">Codigo</th>
            <th scope="col">Responsable</th>
            <th scope="col" className={t.p2}>
              Tipo
            </th>
            <th scope="col" className={t.p3}>
              Sistema operativo
            </th>
            <th scope="col" className={t.p3}>
              Antivirus
            </th>
            <th scope="col" className={t.p3}>
              UPS
            </th>
            <th scope="col" className={cx(t.colFecha, t.p3)}>
              Ult. actualizacion
            </th>
            <th scope="col" className={t.colEstado}>
              Seguridad
            </th>
          </tr>
        </thead>
        <tbody>
          {dispositivos.map((d) => (
            <tr key={d.id_dispositivo}>
              <td className={t.colId}>{d.id_dispositivo}</td>
              <td>{d.codigo_equipo}</td>
              <td>{d.responsable}</td>
              <td className={t.p2}>{d.tipo_dispositivo}</td>
              <td className={t.p3}>{oGuion(d.sistema_operativo)}</td>
              <td className={t.p3}>
                <SiNo valor={d.antivirus_activo} />
              </td>
              <td className={t.p3}>
                <SiNo valor={d.tiene_ups} />
              </td>
              <td className={cx(t.colFecha, t.p3)}>
                {formatearFecha(d.fecha_ultima_actualizacion)}
              </td>
              <td className={t.colEstado}>
                <Badge tono={d.estado_seguridad === "Cumple" ? "ok" : "malo"}>
                  {d.estado_seguridad}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </Tabla>
    </PanelTabla>
  );
}
