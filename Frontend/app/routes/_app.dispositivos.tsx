import { useState } from "react";
import type { Route } from "./+types/_app.dispositivos";
import { requerirSesion } from "@/shared/auth/requerir";
import { ROLES_ESCRITURA } from "@/shared/tipos/rol";
import { ejecutarAccion, type ResultadoAccion } from "@/shared/api/resultado";
import { useAccion } from "@/shared/api/useAccion";
import { Alert } from "@/shared/ui/Alert/Alert";
import { Boton } from "@/shared/ui/Boton/Boton";
import { EncabezadoPagina } from "@/shared/ui/EncabezadoPagina/EncabezadoPagina";
import { EstadoVacio } from "@/shared/ui/EstadoVacio/EstadoVacio";
import { Modal } from "@/shared/ui/Modal/Modal";
import { ToolbarTabla } from "@/shared/ui/Tabla/ToolbarTabla";
import { useFiltroTabla } from "@/shared/ui/Tabla/useFiltroTabla";
import {
  listarUsuarios,
  opcionesDeUsuarios,
} from "@/features/catalogos/api/catalogosApi";
import {
  crearDispositivo,
  listarDispositivos,
} from "@/features/dispositivos/api/dispositivosApi";
import type { DatosDispositivo } from "@/features/dispositivos/dominio/dispositivo";
import { DispositivoFormulario } from "@/features/dispositivos/components/DispositivoFormulario";
import { DispositivosTabla } from "@/features/dispositivos/components/DispositivosTabla";

export function meta() {
  return [{ title: "Dispositivos · VinkaPlant" }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const usuario = await requerirSesion(request);
  const puedeEscribir = ROLES_ESCRITURA.includes(usuario.id_rol);

  // El catalogo de usuarios solo hace falta para el formulario de alta.
  const [dispositivos, usuarios] = await Promise.all([
    listarDispositivos(request.signal),
    puedeEscribir ? listarUsuarios(request.signal) : Promise.resolve([]),
  ]);

  return {
    dispositivos,
    responsables: opcionesDeUsuarios(usuarios),
    puedeEscribir,
  };
}

interface PeticionDispositivo {
  readonly datos: DatosDispositivo;
}

export async function clientAction({
  request,
}: Route.ClientActionArgs): Promise<ResultadoAccion> {
  await requerirSesion(request);
  const peticion = (await request.json()) as PeticionDispositivo;
  return ejecutarAccion(() => crearDispositivo(peticion.datos));
}

export default function Dispositivos({ loaderData }: Route.ComponentProps) {
  const { dispositivos, responsables, puedeEscribir } = loaderData;
  const accion = useAccion("dispositivos");
  const [pedido, setPedido] = useState(false);
  const abierto = pedido && !accion.exito;

  const { filtro, setFiltro, resultado } = useFiltroTabla(dispositivos, (d) => [
    d.codigo_equipo,
    d.responsable,
    d.tipo_dispositivo,
    d.sistema_operativo,
    d.estado_seguridad,
  ]);

  return (
    <>
      <EncabezadoPagina
        titulo="Dispositivos"
        subtitulo="Inventario de equipos y su postura de seguridad."
        acciones={
          puedeEscribir && (
            <Boton
              variante="primario"
              onClick={() => {
                accion.reiniciar();
                setPedido(true);
              }}
            >
              + Registrar dispositivo
            </Boton>
          )
        }
      />

      {accion.exito && <Alert tono="exito">{accion.resultado?.mensaje}</Alert>}
      {accion.error !== null && !abierto && (
        <Alert tono="error">{accion.error}</Alert>
      )}

      {dispositivos.length === 0 ? (
        <EstadoVacio
          titulo="No hay dispositivos registrados"
          detalle="Los dispositivos solo se listan y se crean: el contrato no admite edicion ni borrado."
        />
      ) : (
        <>
          <ToolbarTabla
            filtro={filtro}
            onFiltroChange={setFiltro}
            etiquetaBusqueda="Buscar por codigo, responsable, tipo o SO"
            mostrando={resultado.length}
            total={dispositivos.length}
          />
          {resultado.length === 0 ? (
            <EstadoVacio
              titulo="Sin resultados"
              detalle={`Ningun dispositivo coincide con "${filtro}".`}
            />
          ) : (
            <DispositivosTabla dispositivos={resultado} />
          )}
        </>
      )}

      <Modal
        abierto={abierto}
        titulo="Registrar dispositivo"
        onCerrar={() => {
          setPedido(false);
        }}
      >
        <DispositivoFormulario
          responsables={responsables}
          guardando={accion.ocupado}
          errorServidor={accion.error}
          onCancelar={() => {
            setPedido(false);
          }}
          onGuardar={(datos) => {
            accion.enviar({ datos });
          }}
        />
      </Modal>
    </>
  );
}
