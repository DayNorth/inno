import { Badge } from "@/shared/ui/Badge/Badge";
import { Boton } from "@/shared/ui/Boton/Boton";
import { PanelTabla, t, Tabla } from "@/shared/ui/Tabla/Tabla";
import { oGuion, SIN_DATO } from "@/shared/utils/formato";
import { cx } from "@/shared/utils/cx";
import { enlaceCorreo } from "@/shared/utils/enlaceSeguro";
import type { Cliente } from "../dominio/cliente";

/**
 * El correo llega del backend, asi que su esquema se comprueba antes de
 * interpolarlo en un `href`: un `javascript:` en un campo de texto seria
 * ejecutable (frontend-seguridad.md §3.5). Si no es un enlace seguro, se
 * muestra como texto plano.
 */
function CeldaCorreo({ correo }: { readonly correo: string | null }) {
  const href = enlaceCorreo(correo);
  if (correo === null || correo.trim() === "") return <>{SIN_DATO}</>;
  return href === null ? <>{correo}</> : <a href={href}>{correo}</a>;
}

interface Props {
  readonly clientes: readonly Cliente[];
  readonly puedeEditar: boolean;
  readonly ocupado: boolean;
  readonly onEditar: (c: Cliente) => void;
  readonly onCambiarEstado: (c: Cliente) => void;
}

export function ClientesTabla({
  clientes,
  puedeEditar,
  ocupado,
  onEditar,
  onCambiarEstado,
}: Props) {
  return (
    <PanelTabla>
      <Tabla etiqueta="Clientes">
        <colgroup>
          <col className={t.ancho5} />
          <col className={t.flexible} />
          <col className={t.ancho9} />
          <col className={t.ancho14} />
          <col className={t.ancho9} />
          <col className={t.ancho7} />
          {puedeEditar && <col className={t.ancho12} />}
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className={t.colId}>
              ID
            </th>
            <th scope="col">Nombre</th>
            <th scope="col" className={t.p3}>
              Pais
            </th>
            <th scope="col" className={t.p2}>
              Correo
            </th>
            <th scope="col" className={t.p3}>
              Telefono
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
          {clientes.map((c) => (
            <tr key={c.id_cliente}>
              <td className={t.colId}>{c.id_cliente}</td>
              <td>{c.nombre}</td>
              <td className={t.p3}>{oGuion(c.pais)}</td>
              <td className={t.p2}>
                <CeldaCorreo correo={c.correo} />
              </td>
              <td className={cx(t.p3, t.colNumero)}>{oGuion(c.telefono)}</td>
              <td className={t.colEstado}>
                <Badge tono={c.estado === "Activo" ? "ok" : "neutro"}>
                  {c.estado}
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
                        onEditar(c);
                      }}
                    >
                      Editar
                    </Boton>
                    <Boton
                      pequeno
                      variante={c.estado === "Activo" ? "peligro" : "secundario"}
                      disabled={ocupado}
                      onClick={() => {
                        onCambiarEstado(c);
                      }}
                    >
                      {c.estado === "Activo" ? "Inactivar" : "Reactivar"}
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
