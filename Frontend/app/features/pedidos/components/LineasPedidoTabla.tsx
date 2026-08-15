import { PanelTabla, t, Tabla } from "@/shared/ui/Tabla/Tabla";
import { formatearEntero, formatearMoneda } from "@/shared/utils/formato";
import type { LineaPedido } from "../dominio/pedido";

interface Props {
  readonly lineas: readonly LineaPedido[];
  readonly total: number;
}

export function LineasPedidoTabla({ lineas, total }: Props) {
  return (
    <PanelTabla>
      <Tabla etiqueta="Lineas del pedido">
        <colgroup>
          <col className={t.flexible} />
          <col className={t.ancho6} />
          <col className={t.ancho8} />
          <col className={t.ancho8} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Planta</th>
            <th scope="col" className={t.colNumero}>
              Cantidad
            </th>
            <th scope="col" className={t.colNumero}>
              Precio
            </th>
            <th scope="col" className={t.colNumero}>
              Subtotal
            </th>
          </tr>
        </thead>
        <tbody>
          {lineas.map((l) => (
            <tr key={l.id_detalle}>
              <td>{l.nombre_producto}</td>
              <td className={t.colNumero}>{formatearEntero(l.cantidad)}</td>
              <td className={t.colNumero}>{formatearMoneda(l.precio_unitario)}</td>
              <td className={t.colNumero}>{formatearMoneda(l.subtotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={3}>
              Total
            </th>
            <td className={t.colNumero}>
              <strong>{formatearMoneda(total)}</strong>
            </td>
          </tr>
        </tfoot>
      </Tabla>
    </PanelTabla>
  );
}
