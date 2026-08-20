import type { Route } from "./+types/_app.permisos";
import { requerirRol } from "@/shared/auth/requerir";
import { ROLES, ROLES_ADMIN, ETIQUETA_ROL, type IdRol } from "@/shared/tipos/rol";
import { ejecutarAccion, type ResultadoAccion } from "@/shared/api/resultado";
import { useAccion } from "@/shared/api/useAccion";
import { Alert } from "@/shared/ui/Alert/Alert";
import { EncabezadoPagina } from "@/shared/ui/EncabezadoPagina/EncabezadoPagina";
import { PanelTabla, Tabla } from "@/shared/ui/Tabla/Tabla";
import { idPermiso, type IdPermiso } from "@/shared/tipos/marca";
import {
  asignarPermiso,
  listarMatriz,
  listarPermisos,
  revocarPermiso,
} from "@/features/permisos/api/permisosApi";
import { claveAsignacion } from "@/features/permisos/dominio/permiso";

export function meta() {
  return [{ title: "Permisos · VinkaPlant" }];
}

const COLUMNAS_ROL: readonly { readonly id: IdRol; readonly etiqueta: string }[] =
  (Object.values(ROLES) as IdRol[]).map((id) => ({
    id,
    etiqueta: ETIQUETA_ROL[id],
  }));

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  await requerirRol(ROLES_ADMIN, request);

  const [permisos, matriz] = await Promise.all([
    listarPermisos(request.signal),
    listarMatriz(request.signal),
  ]);

  const asignados = new Set(
    matriz.map((a) => claveAsignacion(a.id_rol, a.id_permiso)),
  );

  return { permisos, asignados: [...asignados] };
}

type PeticionPermisos =
  | { readonly intencion: "asignar"; readonly idRol: number; readonly idPermiso: number }
  | { readonly intencion: "revocar"; readonly idRol: number; readonly idPermiso: number };

export async function clientAction({
  request,
}: Route.ClientActionArgs): Promise<ResultadoAccion> {
  await requerirRol(ROLES_ADMIN, request);
  const peticion = (await request.json()) as PeticionPermisos;
  const idRol = peticion.idRol as IdRol;
  const idPermisoValor = idPermiso(peticion.idPermiso);

  return ejecutarAccion(async () => {
    switch (peticion.intencion) {
      case "asignar":
        return await asignarPermiso(idRol, idPermisoValor);
      case "revocar":
        return await revocarPermiso(idRol, idPermisoValor);
    }
  });
}

export default function Permisos({ loaderData }: Route.ComponentProps) {
  const { permisos, asignados } = loaderData;
  const accion = useAccion("permisos");

  const asignadosSet = new Set(asignados);

  const alternar = (idRol: IdRol, idPermisoValor: IdPermiso, marcado: boolean): void => {
    accion.reiniciar();
    accion.enviar(
      marcado
        ? { intencion: "asignar", idRol, idPermiso: idPermisoValor }
        : { intencion: "revocar", idRol, idPermiso: idPermisoValor },
    );
  };

  return (
    <>
      <EncabezadoPagina
        titulo="Permisos"
        subtitulo="Que puede hacer cada rol dentro del sistema. Solo Administrador puede modificar esta matriz."
      />

      {accion.error !== null && <Alert tono="error">{accion.error}</Alert>}

      {permisos.length === 0 ? (
        <Alert tono="info">Todavia no hay permisos en el catalogo.</Alert>
      ) : (
        <PanelTabla aviso="El rol Administrador conserva siempre acceso total al sistema, incluso si se le retira algun permiso aqui.">
          <Tabla etiqueta="Matriz de permisos por rol">
            <colgroup>
              <col className="w-auto" />
              {COLUMNAS_ROL.map((c) => (
                <col key={c.id} className="w-32" />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th scope="col">Permiso</th>
                {COLUMNAS_ROL.map((c) => (
                  <th key={c.id} scope="col" className="text-center">
                    {c.etiqueta}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permisos.map((p) => (
                <tr key={p.id_permiso}>
                  <td>
                    <p className="font-medium">{p.nombre_permiso}</p>
                    {p.descripcion !== null && (
                      <p className="text-xs text-ink-tenue">{p.descripcion}</p>
                    )}
                  </td>
                  {COLUMNAS_ROL.map((c) => {
                    const marcado = asignadosSet.has(
                      claveAsignacion(c.id, p.id_permiso),
                    );
                    return (
                      <td key={c.id} className="text-center">
                        <input
                          type="checkbox"
                          checked={marcado}
                          disabled={accion.ocupado}
                          aria-label={`${p.nombre_permiso} - ${c.etiqueta}`}
                          onChange={(e) => {
                            alternar(c.id, p.id_permiso, e.target.checked);
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </Tabla>
        </PanelTabla>
      )}
    </>
  );
}
