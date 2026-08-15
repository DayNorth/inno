import { Link } from "react-router";
import type { Route } from "./+types/_app.proveedores.$id";
import { RUTAS } from "@/rutas";
import { requerirSesion } from "@/shared/auth/requerir";
import { ROLES_ESCRITURA } from "@/shared/tipos/rol";
import { idProveedorDesde } from "@/shared/tipos/marca";
import { ejecutarAccion, type ResultadoAccion } from "@/shared/api/resultado";
import { useAccion } from "@/shared/api/useAccion";
import { Alert } from "@/shared/ui/Alert/Alert";
import { Badge } from "@/shared/ui/Badge/Badge";
import { EncabezadoPagina } from "@/shared/ui/EncabezadoPagina/EncabezadoPagina";
import { EstadoVacio } from "@/shared/ui/EstadoVacio/EstadoVacio";
import { SiNo } from "@/shared/ui/SiNo/SiNo";
import {
  ColumnaDetalle,
  Dato,
  ItemDetalle,
  ListaDatos,
  ListaItems,
  PanelDetalle,
  RejillaDetalle,
} from "@/shared/ui/Detalle/Detalle";
import { formatearFecha, oGuion } from "@/shared/utils/formato";
import {
  obtenerProveedor,
  registrarEvaluacion,
  registrarPlan,
} from "@/features/proveedores/api/proveedoresApi";
import {
  tonoNivelRiesgo,
  tonoResultado,
  type CriteriosEvaluacion,
  type DatosPlan,
} from "@/features/proveedores/dominio/proveedor";
import { EvaluacionFormulario } from "@/features/proveedores/components/EvaluacionFormulario";
import { PlanFormulario } from "@/features/proveedores/components/PlanFormulario";

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `${loaderData.proveedor.nombre_proveedor} · VinkaPlant` }];
}

export async function clientLoader({ params, request }: Route.ClientLoaderArgs) {
  const usuario = await requerirSesion(request);
  // `params.id` es `string` por el nombre del ARCHIVO. `idProveedorDesde`
  // convierte /proveedores/abc en un 404 del router, antes de tocar la red.
  const id = idProveedorDesde(params.id);

  return {
    proveedor: await obtenerProveedor(id, request.signal),
    puedeEscribir: ROLES_ESCRITURA.includes(usuario.id_rol),
  };
}

type PeticionDetalle =
  | { readonly intencion: "evaluar"; readonly criterios: CriteriosEvaluacion }
  | { readonly intencion: "plan"; readonly datos: DatosPlan };

export async function clientAction({
  params,
  request,
}: Route.ClientActionArgs): Promise<ResultadoAccion> {
  await requerirSesion(request);
  const id = idProveedorDesde(params.id);
  const peticion = (await request.json()) as PeticionDetalle;

  return ejecutarAccion(async () => {
    switch (peticion.intencion) {
      case "evaluar":
        return await registrarEvaluacion(id, peticion.criterios);
      case "plan":
        return await registrarPlan(id, peticion.datos);
    }
  });
}

export default function ProveedorDetalle({ loaderData }: Route.ComponentProps) {
  const { proveedor, puedeEscribir } = loaderData;
  const accion = useAccion("proveedor-detalle");

  return (
    <>
      <EncabezadoPagina
        titulo={proveedor.nombre_proveedor}
        subtitulo={`Proveedor #${proveedor.id_proveedor}`}
        acciones={<Link to={RUTAS.proveedores}>← Volver a proveedores</Link>}
      />

      {accion.exito && <Alert tono="exito">{accion.resultado?.mensaje}</Alert>}
      {accion.error !== null && <Alert tono="error">{accion.error}</Alert>}

      <RejillaDetalle>
        <ColumnaDetalle>
          <PanelDetalle titulo="Datos del proveedor">
            <ListaDatos>
              <Dato etiqueta="Tipo de servicio">
                {oGuion(proveedor.tipo_servicio)}
              </Dato>
              <Dato etiqueta="Estado del contrato">
                {proveedor.estado_contrato}
              </Dato>
              <Dato etiqueta="Evaluaciones">
                {proveedor.evaluaciones.length}
              </Dato>
              <Dato etiqueta="Planes de contingencia">
                {proveedor.planes_contingencia.length}
              </Dato>
            </ListaDatos>
          </PanelDetalle>

          <PanelDetalle titulo="Historial de evaluaciones">
            {proveedor.evaluaciones.length === 0 ? (
              <EstadoVacio titulo="Sin evaluaciones" />
            ) : (
              <ListaItems>
                {proveedor.evaluaciones.map((e) => (
                  <ItemDetalle
                    key={e.id_evaluacion}
                    fecha={formatearFecha(e.fecha_evaluacion)}
                    cabecera={
                      <>
                        <strong>{e.puntaje_total} pts</strong>{" "}
                        <Badge tono={tonoResultado(e.resultado)}>
                          {e.resultado}
                        </Badge>{" "}
                        <Badge tono={tonoNivelRiesgo(e.nivel_riesgo)}>
                          {`Riesgo ${e.nivel_riesgo}`}
                        </Badge>
                      </>
                    }
                  >
                    <ListaDatos>
                      <Dato etiqueta="Cifrado de datos">
                        <SiNo valor={e.cifrado_datos} />
                      </Dato>
                      <Dato etiqueta="MFA disponible">
                        <SiNo valor={e.mfa_disponible} />
                      </Dato>
                      <Dato etiqueta="SLA definido">
                        <SiNo valor={e.sla_definido} />
                      </Dato>
                      <Dato etiqueta="Certificaciones vigentes">
                        <SiNo valor={e.certificaciones_vigentes} />
                      </Dato>
                    </ListaDatos>
                  </ItemDetalle>
                ))}
              </ListaItems>
            )}
          </PanelDetalle>

          <PanelDetalle titulo="Planes de contingencia">
            {proveedor.planes_contingencia.length === 0 ? (
              <EstadoVacio titulo="Sin planes registrados" />
            ) : (
              <ListaItems>
                {proveedor.planes_contingencia.map((p) => (
                  <ItemDetalle
                    key={p.id_plan}
                    fecha={formatearFecha(p.fecha_actualizacion)}
                    cabecera={<strong>{p.escenario}</strong>}
                  >
                    <p>{p.procedimiento_alterno}</p>
                    <p>Responsable: {oGuion(p.responsable)}</p>
                  </ItemDetalle>
                ))}
              </ListaItems>
            )}
          </PanelDetalle>
        </ColumnaDetalle>

        {puedeEscribir && (
          <ColumnaDetalle>
            <PanelDetalle titulo="Nueva evaluacion">
              <EvaluacionFormulario
                guardando={accion.ocupado}
                errorServidor={null}
                onGuardar={(criterios) => {
                  accion.enviar({ intencion: "evaluar", criterios });
                }}
              />
            </PanelDetalle>

            <PanelDetalle titulo="Nuevo plan de contingencia">
              <PlanFormulario
                guardando={accion.ocupado}
                errorServidor={null}
                onGuardar={(datos) => {
                  accion.enviar({ intencion: "plan", datos });
                }}
              />
            </PanelDetalle>
          </ColumnaDetalle>
        )}
      </RejillaDetalle>
    </>
  );
}
