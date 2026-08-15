import { Badge } from "@/shared/ui/Badge/Badge";
import { Boton } from "@/shared/ui/Boton/Boton";
import { PanelTabla, t, Tabla } from "@/shared/ui/Tabla/Tabla";
import { cx } from "@/shared/utils/cx";
import { formatearFecha } from "@/shared/utils/formato";
import type { Acceso } from "../dominio/acceso";

interface Props {
  readonly accesos: readonly Acceso[];
  readonly puedeRevisar: boolean;
  /** Solo rol 1. Para el rol 2 el boton NO se renderiza (contrato §6.1). */
  readonly puedeRevocar: boolean;
  readonly ocupado: boolean;
  readonly onRevisar: (a: Acceso) => void;
  readonly onRevocar: (a: Acceso) => void;
}

export function AccesosTabla({
  accesos,
  puedeRevisar,
  puedeRevocar,
  ocupado,
  onRevisar,
  onRevocar,
}: Props) {
  const hayAcciones = puedeRevisar || puedeRevocar;

  return (
    <PanelTabla>
      <Tabla etiqueta="Accesos a plataformas">
        <colgroup>
          <col className={t.ancho5} />
          <col className={t.flexible} />
          <col className={t.ancho11} />
          <col className={t.ancho11} />
          <col className={t.ancho7} />
          <col className={t.ancho7} />
          <col className={t.ancho7} />
          {hayAcciones && <col className={t.ancho12} />}
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className={t.colId}>
              ID
            </th>
            <th scope="col">Usuario</th>
            <th scope="col">Plataforma</th>
            <th scope="col" className={t.p2}>
              Rol de acceso
            </th>
            <th scope="col" className={cx(t.colFecha, t.p3)}>
              Fecha de alta
            </th>
            <th scope="col" className={cx(t.colFecha, t.p3)}>
              Ultima revision
            </th>
            <th scope="col" className={t.colEstado}>
              Estado
            </th>
            {hayAcciones && (
              <th scope="col" className={t.colAcciones}>
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {accesos.map((a) => (
            <tr key={a.id_acceso}>
              <td className={t.colId}>{a.id_acceso}</td>
              <td>{a.usuario}</td>
              <td>{a.plataforma}</td>
              <td className={t.p2}>{a.rol_acceso}</td>
              <td className={cx(t.colFecha, t.p3)}>
                {formatearFecha(a.fecha_alta)}
              </td>
              <td className={cx(t.colFecha, t.p3)}>
                {formatearFecha(a.fecha_ultima_revision)}
              </td>
              <td className={t.colEstado}>
                <Badge tono={a.estado === "Vigente" ? "ok" : "neutro"}>
                  {a.estado}
                </Badge>
              </td>
              {hayAcciones && (
                <td className={t.colAcciones}>
                  <div className={t.acciones}>
                    {/* El nombre accesible lleva el contexto de la fila: si no,
                        un lector de pantalla anuncia una lista de botones
                        "Revisar" identicos, sin forma de saber cual es cual. */}
                    {puedeRevisar && (
                      <Boton
                        pequeno
                        disabled={ocupado}
                        aria-label={
                          a.estado === "Revocado"
                            ? `Revisar y reactivar el acceso de ${a.usuario} a ${a.plataforma}`
                            : `Revisar el acceso de ${a.usuario} a ${a.plataforma}`
                        }
                        onClick={() => {
                          onRevisar(a);
                        }}
                      >
                        Revisar
                      </Boton>
                    )}
                    {puedeRevocar && a.estado === "Vigente" && (
                      <Boton
                        pequeno
                        variante="peligro"
                        disabled={ocupado}
                        aria-label={`Revocar el acceso de ${a.usuario} a ${a.plataforma}`}
                        onClick={() => {
                          onRevocar(a);
                        }}
                      >
                        Revocar
                      </Boton>
                    )}
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
