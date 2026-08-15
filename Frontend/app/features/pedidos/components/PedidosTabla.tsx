import { Link } from "react-router";
import { rutaPedidoDetalle } from "@/rutas";
import { Badge } from "@/shared/ui/Badge/Badge";
import { PanelTabla, t, Tabla } from "@/shared/ui/Tabla/Tabla";
import { cx } from "@/shared/utils/cx";
import { formatearEntero, formatearFecha, formatearMoneda } from "@/shared/utils/formato";
import { tonoEstadoPedido, type PedidoLista } from "../dominio/pedido";

export function PedidosTabla({ pedidos }: { readonly pedidos: readonly PedidoLista[] }) {
  return (
    <PanelTabla>
      <Tabla etiqueta="Pedidos">
        <colgroup>
          <col className={t.ancho5} />
          <col className={t.flexible} />
          <col className={t.ancho10} />
          <col className={t.ancho7} />
          <col className={t.ancho8} />
          <col className={t.ancho5} />
          <col className={t.ancho8} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className={t.colId}>
              ID
            </th>
            <th scope="col">Cliente</th>
            <th scope="col" className={t.p3}>
              Usuario
            </th>
            <th scope="col" className={cx(t.colFecha, t.p2)}>
              Fecha
            </th>
            <th scope="col" className={t.colEstado}>
              Estado
            </th>
            <th scope="col" className={cx(t.colNumero, t.p2)}>
              Plantas
            </th>
            <th scope="col" className={t.colNumero}>
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((p) => (
            <tr key={p.id_pedido}>
              {/* El ID es el enlace al detalle: la accion principal en la
                  primera columna, que nunca se recorta. */}
              <td className={t.colId}>
                <Link to={rutaPedidoDetalle(p.id_pedido)}>{p.id_pedido}</Link>
              </td>
              <td>{p.cliente}</td>
              <td className={t.p3}>{p.usuario}</td>
              <td className={cx(t.colFecha, t.p2)}>{formatearFecha(p.fecha)}</td>
              <td className={t.colEstado}>
                <Badge tono={tonoEstadoPedido(p.estado)}>{p.estado}</Badge>
              </td>
              <td className={cx(t.colNumero, t.p2)}>
                {formatearEntero(p.cantidad_productos)}
              </td>
              <td className={t.colNumero}>{formatearMoneda(p.total)}</td>
            </tr>
          ))}
        </tbody>
      </Tabla>
    </PanelTabla>
  );
}
