import { Badge, type TonoBadge } from "@/shared/ui/Badge/Badge";
import { Boton } from "@/shared/ui/Boton/Boton";
import { PanelTabla, t, Tabla } from "@/shared/ui/Tabla/Tabla";
import { oGuion } from "@/shared/utils/formato";
import { cx } from "@/shared/utils/cx";
import type { EstadoFitosanitario, Producto } from "../dominio/producto";

const TONO_FITOSANITARIO: Record<EstadoFitosanitario, TonoBadge> = {
  Sano: "ok",
  "En observación": "aviso",
  "En tratamiento": "aviso",
  Rechazado: "malo",
};

interface Props {
  readonly productos: readonly Producto[];
  readonly puedeEditar: boolean;
  readonly ocupado: boolean;
  readonly onEditar: (p: Producto) => void;
  readonly onCambiarEstado: (p: Producto) => void;
}

export function ProductosTabla({
  productos,
  puedeEditar,
  ocupado,
  onEditar,
  onCambiarEstado,
}: Props) {
  return (
    <PanelTabla>
      <Tabla etiqueta="Productos">
        <colgroup>
          <col className={t.ancho5} />
          <col className={t.flexible} />
          <col className={t.ancho9} />
          <col className={t.ancho14} />
          <col className={t.p3} />
          <col className={t.colEstado} />
          {puedeEditar && <col className={t.ancho12} />}
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className={t.colId}>
              ID
            </th>
            <th scope="col">Nombre</th>
            <th scope="col" className={t.ancho9}>
              Cantidad
            </th>
            <th scope="col" className={t.p3}>
              Ubicacion
            </th>
            <th scope="col" className={t.p3}>
              Estado fitosanitario
            </th>
            <th scope="col" className={t.colEstado}>
              Estado
            </th>
            {puedeEditar && (
              <th scope="col" className={t.colAcciones}>
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {productos.map((p) => (
            <tr key={p.id_producto}>
              <td className={t.colId}>{p.id_producto}</td>
              <td>{p.nombre_producto}</td>
              <td className={cx(t.ancho9, t.colNumero)}>
                {p.cantidad_disponible}
              </td>
              <td className={t.p3}>{oGuion(p.ubicacion_invernadero)}</td>
              <td className={t.p3}>
                <Badge tono={TONO_FITOSANITARIO[p.estado_fitosanitario]}>
                  {p.estado_fitosanitario}
                </Badge>
              </td>
              <td className={t.colEstado}>
                <Badge tono={p.estado === "Activo" ? "ok" : "neutro"}>
                  {p.estado}
                </Badge>
              </td>
              {puedeEditar && (
                <td className={t.colAcciones}>
                  <div className={t.acciones}>
                    <Boton
                      pequeno
                      variante="secundario"
                      disabled={ocupado}
                      onClick={() => {
                        onEditar(p);
                      }}
                    >
                      Editar
                    </Boton>
                    <Boton
                      pequeno
                      variante={p.estado === "Activo" ? "peligro" : "secundario"}
                      disabled={ocupado}
                      onClick={() => {
                        onCambiarEstado(p);
                      }}
                    >
                      {p.estado === "Activo" ? "Inactivar" : "Reactivar"}
                    </Boton>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </Tabla>
    </PanelTabla>
  );
}
