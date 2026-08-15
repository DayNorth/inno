import { useState } from "react";
import type { Route } from "./+types/_app.incidentes";
import { requerirSesion } from "@/shared/auth/requerir";
import { ROLES_ESCRITURA } from "@/shared/tipos/rol";
import { ejecutarAccion, type ResultadoAccion } from "@/shared/api/resultado";
import { useAccion } from "@/shared/api/useAccion";
import { idIncidente } from "@/shared/tipos/marca";
import { Alert } from "@/shared/ui/Alert/Alert";
import { Boton } from "@/shared/ui/Boton/Boton";
import { EncabezadoPagina } from "@/shared/ui/EncabezadoPagina/EncabezadoPagina";
import { EstadoVacio } from "@/shared/ui/EstadoVacio/EstadoVacio";
import { Modal } from "@/shared/ui/Modal/Modal";
import { ToolbarTabla } from "@/shared/ui/Tabla/ToolbarTabla";
import { useFiltroTabla } from "@/shared/ui/Tabla/useFiltroTabla";
import {
  listarPlataformas,
  listarUsuarios,
  opcionesDePlataformas,
  opcionesDeUsuarios,
} from "@/features/catalogos/api/catalogosApi";
import {
  listarIncidentes,
  reportarIncidente,
  resolverIncidente,
} from "@/features/incidentes/api/incidentesApi";
import type {
  DatosIncidente,
  Incidente,
} from "@/features/incidentes/dominio/incidente";
import { IncidenteFormulario } from "@/features/incidentes/components/IncidenteFormulario";
import { IncidentesTabla } from "@/features/incidentes/components/IncidentesTabla";
import { ResolverIncidenteFormulario } from "@/features/incidentes/components/ResolverIncidenteFormulario";

export function meta() {
  return [{ title: "Incidentes · VinkaPlant" }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const usuario = await requerirSesion(request);
  const puedeEscribir = ROLES_ESCRITURA.includes(usuario.id_rol);

  const [incidentes, plataformas, usuarios] = await Promise.all([
    listarIncidentes(request.signal),
    puedeEscribir ? listarPlataformas(request.signal) : Promise.resolve([]),
    puedeEscribir ? listarUsuarios(request.signal) : Promise.resolve([]),
  ]);

  return {
    incidentes,
    plataformas: opcionesDePlataformas(plataformas),
    responsables: opcionesDeUsuarios(usuarios),
    puedeEscribir,
  };
}

type PeticionIncidente =
  | { readonly intencion: "reportar"; readonly datos: DatosIncidente }
  | {
      readonly intencion: "resolver";
      readonly id: number;
      readonly fecha_resolucion: string | null;
    };

export async function clientAction({
  request,
}: Route.ClientActionArgs): Promise<ResultadoAccion> {
  await requerirSesion(request);
  const peticion = (await request.json()) as PeticionIncidente;

  return ejecutarAccion(async () => {
    switch (peticion.intencion) {
      case "reportar":
        return await reportarIncidente(peticion.datos);
      case "resolver":
        return await resolverIncidente(
          idIncidente(peticion.id),
          peticion.fecha_resolucion,
        );
    }
  });
}

export default function Incidentes({ loaderData }: Route.ComponentProps) {
  const { incidentes, plataformas, responsables, puedeEscribir } = loaderData;
  const accion = useAccion("incidentes");

  const [pedido, setPedido] = useState(false);
  const [porResolver, setPorResolver] = useState<Incidente | null>(null);
  const abierto = pedido && !accion.exito;
  const resolucionAbierta = porResolver !== null && !accion.exito;

  const { filtro, setFiltro, resultado } = useFiltroTabla(incidentes, (i) => [
    i.titulo,
    i.plataforma,
    i.responsable,
    i.estado,
  ]);

  return (
    <>
      <EncabezadoPagina
        titulo="Incidentes"
        subtitulo="Reporte y resolucion de incidentes de plataforma."
        acciones={
          puedeEscribir && (
            <Boton
              variante="primario"
              onClick={() => {
                accion.reiniciar();
                setPedido(true);
              }}
            >
              + Reportar incidente
            </Boton>
          )
        }
      />

      {accion.exito && <Alert tono="exito">{accion.resultado?.mensaje}</Alert>}
      {accion.error !== null && !abierto && porResolver === null && (
        <Alert tono="error">{accion.error}</Alert>
      )}

      {incidentes.length === 0 ? (
        <EstadoVacio titulo="No hay incidentes registrados" />
      ) : (
        <>
          <ToolbarTabla
            filtro={filtro}
            onFiltroChange={setFiltro}
            etiquetaBusqueda="Buscar por titulo, plataforma o responsable"
            mostrando={resultado.length}
            total={incidentes.length}
          />
          {resultado.length === 0 ? (
            <EstadoVacio
              titulo="Sin resultados"
              detalle={`Ningun incidente coincide con "${filtro}".`}
            />
          ) : (
            <IncidentesTabla
              incidentes={resultado}
              puedeResolver={puedeEscribir}
              ocupado={accion.ocupado}
              onResolver={(i) => {
                accion.reiniciar();
                setPorResolver(i);
              }}
            />
          )}
        </>
      )}

      <Modal
        abierto={abierto}
        titulo="Reportar incidente"
        onCerrar={() => {
          setPedido(false);
        }}
      >
        <IncidenteFormulario
          plataformas={plataformas}
          responsables={responsables}
          guardando={accion.ocupado}
          errorServidor={accion.error}
          onCancelar={() => {
            setPedido(false);
          }}
          onGuardar={(datos) => {
            accion.enviar({ intencion: "reportar", datos });
          }}
        />
      </Modal>

      <Modal
        abierto={resolucionAbierta}
        titulo="Resolver incidente"
        descripcion={porResolver?.titulo}
        tamano="estrecho"
        onCerrar={() => {
          setPorResolver(null);
        }}
      >
        {porResolver !== null && (
          <ResolverIncidenteFormulario
            incidente={porResolver}
            guardando={accion.ocupado}
            errorServidor={accion.error}
            onCancelar={() => {
              setPorResolver(null);
            }}
            onResolver={(fecha) => {
              accion.enviar({
                intencion: "resolver",
                id: porResolver.id_incidente,
                fecha_resolucion: fecha,
              });
            }}
          />
        )}
      </Modal>
    </>
  );
}
