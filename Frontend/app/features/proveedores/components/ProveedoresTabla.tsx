import { Link } from "react-router";
import { rutaProveedorDetalle } from "@/rutas";
import { Badge } from "@/shared/ui/Badge/Badge";
import { PanelTabla, t, Tabla } from "@/shared/ui/Tabla/Tabla";
import { cx } from "@/shared/utils/cx";
import { formatearFecha, oGuion, SIN_DATO } from "@/shared/utils/formato";
import {
  tonoNivelRiesgo,
  tonoResultado,
  type ProveedorLista,
} from "../dominio/proveedor";

interface Props {
  readonly proveedores: readonly ProveedorLista[];
}

export function ProveedoresTabla({ proveedores }: Props) {
  return (
    <PanelTabla>
      <Tabla etiqueta="Proveedores">
        <colgroup>
          <col className={t.ancho5} />
          <col className={t.flexible} />
          <col className={t.ancho12} />
          <col className={t.ancho7} />
          <col className={t.ancho7} />
          <col className={t.ancho6} />
          <col className={t.ancho8} />
          <col className={t.ancho8} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className={t.colId}>
              ID
            </th>
            <th scope="col">Proveedor</th>
            <th scope="col" className={t.p3}>
              Tipo de servicio
            </th>
            <th scope="col" className={t.p3}>
              Contrato
            </th>
            <th scope="col" className={cx(t.colFecha, t.p2)}>
              Ult. evaluacion
            </th>
            <th scope="col" className={cx(t.colNumero, t.p2)}>
              Puntaje
            </th>
            <th scope="col" className={t.colEstado}>
              Resultado
            </th>
            <th scope="col" className={t.colEstado}>
              Nivel de riesgo
            </th>
          </tr>
        </thead>
        <tbody>
          {proveedores.map((p) => (
            <tr key={p.id_proveedor}>
              {/* El ID ES el enlace al detalle: una columna "Acciones" menos,
                  y la accion principal queda en la posicion que nunca se
                  recorta (frontend-ui.md §5.2). */}
              <td className={t.colId}>
                <Link to={rutaProveedorDetalle(p.id_proveedor)}>
                  {p.id_proveedor}
                </Link>
              </td>
              <td>{p.nombre_proveedor}</td>
              <td className={t.p3}>{oGuion(p.tipo_servicio)}</td>
              <td className={t.p3}>{p.estado_contrato}</td>
              <td className={cx(t.colFecha, t.p2)}>
                {formatearFecha(p.fecha_evaluacion)}
              </td>
              <td className={cx(t.colNumero, t.p2)}>
                {p.puntaje_total ?? SIN_DATO}
              </td>
              <td className={t.colEstado}>
                <Badge tono={tonoResultado(p.resultado)}>
                  {p.resultado ?? "Sin evaluar"}
                </Badge>
              </td>
              <td className={t.colEstado}>
                <Badge tono={tonoNivelRiesgo(p.nivel_riesgo)}>
                  {p.nivel_riesgo ?? "Sin evaluar"}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </Tabla>
    </PanelTabla>
  );
}
