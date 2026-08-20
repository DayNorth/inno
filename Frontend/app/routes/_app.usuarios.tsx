import type { Route } from "./+types/_app.usuarios";
import { requerirRol } from "@/shared/auth/requerir";
import { ROLES_ADMIN } from "@/shared/tipos/rol";
import { ejecutarAccion, type ResultadoAccion } from "@/shared/api/resultado";
import { useAccion } from "@/shared/api/useAccion";
import { Alert } from "@/shared/ui/Alert/Alert";
import { Badge } from "@/shared/ui/Badge/Badge";
import { Boton } from "@/shared/ui/Boton/Boton";
import { EncabezadoPagina } from "@/shared/ui/EncabezadoPagina/EncabezadoPagina";
import { PanelTabla, t, Tabla } from "@/shared/ui/Tabla/Tabla";
import { cx } from "@/shared/utils/cx";
import { formatearFechaHora } from "@/shared/utils/formato";
import { idUsuario } from "@/shared/tipos/marca";
import {
  desbloquearUsuario,
  listarUsuariosAdmin,
} from "@/features/usuarios/api/usuariosApi";
import { LIMITE_INTENTOS_FALLIDOS } from "@/features/usuarios/dominio/usuario";

export function meta() {
  return [{ title: "Usuarios · VinkaPlant" }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  await requerirRol(ROLES_ADMIN, request);
  const usuarios = await listarUsuariosAdmin(request.signal);
  return { usuarios };
}

interface PeticionUsuarios {
  readonly intencion: "desbloquear";
  readonly id: number;
}

export async function clientAction({
  request,
}: Route.ClientActionArgs): Promise<ResultadoAccion> {
  await requerirRol(ROLES_ADMIN, request);
  const peticion = (await request.json()) as PeticionUsuarios;

  return ejecutarAccion(async () => {
    return await desbloquearUsuario(idUsuario(peticion.id));
  });
}

export default function Usuarios({ loaderData }: Route.ComponentProps) {
  const { usuarios } = loaderData;
  const accion = useAccion("usuarios");

  return (
    <>
      <EncabezadoPagina
        titulo="Usuarios"
        subtitulo="Estado de acceso de cada usuario. Una cuenta se bloquea automaticamente tras 5 intentos fallidos consecutivos."
      />

      {accion.exito && <Alert tono="exito">{accion.resultado?.mensaje}</Alert>}
      {accion.error !== null && <Alert tono="error">{accion.error}</Alert>}

      <PanelTabla>
        <Tabla etiqueta="Usuarios">
          <colgroup>
            <col className={t.ancho5} />
            <col className={t.flexible} />
            <col className={t.p2} />
            <col className={t.ancho9} />
            <col className={t.ancho9} />
            <col className={t.ancho14} />
            <col className={t.ancho12} />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className={t.colId}>
                ID
              </th>
              <th scope="col">Nombre</th>
              <th scope="col" className={t.p2}>
                Correo
              </th>
              <th scope="col" className={t.ancho9}>
                Rol
              </th>
              <th scope="col" className={t.ancho9}>
                Intentos fallidos
              </th>
              <th scope="col" className={t.ancho14}>
                Ultimo acceso
              </th>
              <th scope="col" className={t.colAcciones}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => {
              const bloqueado = u.intentos_fallidos >= LIMITE_INTENTOS_FALLIDOS;
              return (
                <tr key={u.id_usuario}>
                  <td className={t.colId}>{u.id_usuario}</td>
                  <td>{u.nombre}</td>
                  <td className={t.p2}>{u.correo}</td>
                  <td className={t.ancho9}>{u.rol}</td>
                  <td className={cx(t.ancho9, t.colNumero)}>
                    <Badge tono={bloqueado ? "malo" : "neutro"}>
                      {bloqueado
                        ? `Bloqueado (${u.intentos_fallidos})`
                        : String(u.intentos_fallidos)}
                    </Badge>
                  </td>
                  <td className={t.ancho14}>
                    {formatearFechaHora(u.ultimo_acceso)}
                  </td>
                  <td className={t.colAcciones}>
                    {bloqueado && (
                      <div className={t.acciones}>
                        <Boton
                          pequeno
                          variante="secundario"
                          disabled={accion.ocupado}
                          onClick={() => {
                            accion.reiniciar();
                            accion.enviar({
                              intencion: "desbloquear",
                              id: u.id_usuario,
                            });
                          }}
                        >
                          Desbloquear
                        </Boton>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Tabla>
      </PanelTabla>
    </>
  );
}
