import { useState } from "react";
import type { Route } from "./+types/_app.accesos";
import { requerirSesion } from "@/shared/auth/requerir";
import { ROLES_ESCRITURA, ROLES_REVOCAR_ACCESO } from "@/shared/tipos/rol";
import { ApiError } from "@/shared/api/ApiError";
import { ejecutarAccion, type ResultadoAccion } from "@/shared/api/resultado";
import { useAccion } from "@/shared/api/useAccion";
import { idAcceso } from "@/shared/tipos/marca";
import { Alert } from "@/shared/ui/Alert/Alert";
import { Boton } from "@/shared/ui/Boton/Boton";
import { EncabezadoPagina } from "@/shared/ui/EncabezadoPagina/EncabezadoPagina";
import { EstadoVacio } from "@/shared/ui/EstadoVacio/EstadoVacio";
import { Modal } from "@/shared/ui/Modal/Modal";
import { ModalConfirmacion } from "@/shared/ui/Modal/ModalConfirmacion";
import { ToolbarTabla } from "@/shared/ui/Tabla/ToolbarTabla";
import { useFiltroTabla } from "@/shared/ui/Tabla/useFiltroTabla";
import {
  listarPlataformas,
  listarUsuarios,
  opcionesDePlataformas,
  opcionesDeUsuarios,
} from "@/features/catalogos/api/catalogosApi";
import {
  crearAcceso,
  listarAccesos,
  marcarAccesoRevisado,
  revocarAcceso,
} from "@/features/accesos/api/accesosApi";
import {
  rolesDeAccesoUsados,
  type Acceso,
  type DatosAcceso,
} from "@/features/accesos/dominio/acceso";
import { AccesoFormulario } from "@/features/accesos/components/AccesoFormulario";
import { AccesosTabla } from "@/features/accesos/components/AccesosTabla";

export function meta() {
  return [{ title: "Accesos · VinkaPlant" }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const usuario = await requerirSesion(request);
  const puedeEscribir = ROLES_ESCRITURA.includes(usuario.id_rol);

  const [accesos, usuarios, plataformas] = await Promise.all([
    listarAccesos(request.signal),
    puedeEscribir ? listarUsuarios(request.signal) : Promise.resolve([]),
    puedeEscribir ? listarPlataformas(request.signal) : Promise.resolve([]),
  ]);

  return {
    accesos,
    usuarios: opcionesDeUsuarios(usuarios),
    plataformas: opcionesDePlataformas(plataformas),
    // `rol_acceso` es texto libre en el contrato: se sugieren los ya usados.
    rolesUsados: rolesDeAccesoUsados(accesos),
    puedeEscribir,
    // Excepcion de rol codificada explicitamente (contrato-api.md §11).
    // Ocultar el boton es UX; el backend devuelve 403 igualmente.
    puedeRevocar: ROLES_REVOCAR_ACCESO.includes(usuario.id_rol),
  };
}

type PeticionAcceso =
  | { readonly intencion: "crear"; readonly datos: DatosAcceso }
  | { readonly intencion: "revisar"; readonly id: number }
  | { readonly intencion: "revocar"; readonly id: number };

export async function clientAction({
  request,
}: Route.ClientActionArgs): Promise<ResultadoAccion> {
  const usuario = await requerirSesion(request);
  const peticion = (await request.json()) as PeticionAcceso;

  return ejecutarAccion(async () => {
    switch (peticion.intencion) {
      case "crear":
        return await crearAcceso(peticion.datos);
      case "revisar":
        return await marcarAccesoRevisado(idAcceso(peticion.id));
      case "revocar":
        if (!ROLES_REVOCAR_ACCESO.includes(usuario.id_rol)) {
          // Corte temprano: evita una peticion que el backend rechazaria con
          // 403. NO es el control de seguridad —ese es el del servidor—, es no
          // molestarlo. Va como ApiError para que el mensaje llegue al usuario
          // tal cual: `mensajeDeError` oculta el texto de un Error corriente en
          // produccion, y aqui el motivo es util y no filtra nada.
          throw new ApiError(
            "No tienes permiso para realizar esta accion",
            403,
            "http",
          );
        }
        return await revocarAcceso(idAcceso(peticion.id));
    }
  });
}

export default function Accesos({ loaderData }: Route.ComponentProps) {
  const { accesos, usuarios, plataformas, rolesUsados, puedeEscribir, puedeRevocar } =
    loaderData;
  const accion = useAccion("accesos");

  const [pedido, setPedido] = useState(false);
  const [porRevocar, setPorRevocar] = useState<Acceso | null>(null);
  /**
   * Revisar un acceso REVOCADO lo devuelve a "Vigente": `PATCH /revisar` pone
   * `estado = 'Vigente'` (contrato §6.3). Es comportamiento del backend, no un
   * error, pero deshacer una revocacion con un boton llamado "Revisar" y sin
   * avisar seria un accidente esperando a ocurrir.
   */
  const [porResucitar, setPorResucitar] = useState<Acceso | null>(null);

  const abierto = pedido && !accion.exito;
  const confirmacionAbierta = porRevocar !== null && !accion.exito;
  const resurreccionAbierta = porResucitar !== null && !accion.exito;
  const hayDialogo = abierto || confirmacionAbierta || resurreccionAbierta;

  const revisar = (a: Acceso): void => {
    accion.enviar({ intencion: "revisar", id: a.id_acceso });
  };

  const { filtro, setFiltro, resultado } = useFiltroTabla(accesos, (a) => [
    a.usuario,
    a.plataforma,
    a.rol_acceso,
    a.estado,
  ]);

  return (
    <>
      <EncabezadoPagina
        titulo="Accesos"
        subtitulo="Accesos a plataformas, con su ultima revision."
        acciones={
          puedeEscribir && (
            <Boton
              variante="primario"
              onClick={() => {
                accion.reiniciar();
                setPedido(true);
              }}
            >
              + Registrar acceso
            </Boton>
          )
        }
      />

      {accion.exito && <Alert tono="exito">{accion.resultado?.mensaje}</Alert>}
      {accion.error !== null && !hayDialogo && (
        <Alert tono="error">{accion.error}</Alert>
      )}

      {accesos.length === 0 ? (
        <EstadoVacio titulo="No hay accesos registrados" />
      ) : (
        <>
          <ToolbarTabla
            filtro={filtro}
            onFiltroChange={setFiltro}
            etiquetaBusqueda="Buscar por usuario, plataforma o rol"
            mostrando={resultado.length}
            total={accesos.length}
          />
          {resultado.length === 0 ? (
            <EstadoVacio
              titulo="Sin resultados"
              detalle={`Ningun acceso coincide con "${filtro}".`}
            />
          ) : (
            <AccesosTabla
              accesos={resultado}
              puedeRevisar={puedeEscribir}
              puedeRevocar={puedeRevocar}
              ocupado={accion.ocupado}
              onRevisar={(a) => {
                accion.reiniciar();
                if (a.estado === "Revocado") {
                  setPorResucitar(a);
                  return;
                }
                revisar(a);
              }}
              onRevocar={(a) => {
                accion.reiniciar();
                setPorRevocar(a);
              }}
            />
          )}
        </>
      )}

      <Modal
        abierto={abierto}
        titulo="Registrar acceso"
        onCerrar={() => {
          setPedido(false);
        }}
      >
        <AccesoFormulario
          usuarios={usuarios}
          plataformas={plataformas}
          rolesUsados={rolesUsados}
          guardando={accion.ocupado}
          errorServidor={accion.error}
          onCancelar={() => {
            setPedido(false);
          }}
          onGuardar={(datos) => {
            accion.enviar({ intencion: "crear", datos });
          }}
        />
      </Modal>

      <ModalConfirmacion
        abierto={confirmacionAbierta}
        titulo="Revocar acceso"
        mensaje={
          porRevocar === null
            ? ""
            : `Se revocara el acceso de ${porRevocar.usuario} a ${porRevocar.plataforma}. Marcarlo como revisado despues volveria a ponerlo en Vigente.`
        }
        textoConfirmar="Revocar"
        destructivo
        ocupado={accion.ocupado}
        error={accion.error}
        onCancelar={() => {
          setPorRevocar(null);
        }}
        onConfirmar={() => {
          if (porRevocar === null) return;
          accion.enviar({ intencion: "revocar", id: porRevocar.id_acceso });
        }}
      />

      <ModalConfirmacion
        abierto={resurreccionAbierta}
        titulo="Reactivar un acceso revocado"
        mensaje={
          porResucitar === null
            ? ""
            : `Marcar como revisado el acceso de ${porResucitar.usuario} a ${porResucitar.plataforma} lo devolvera a "Vigente", porque el servidor pone esa fecha y ese estado a la vez. Ahora mismo esta revocado.`
        }
        textoConfirmar="Revisar y reactivar"
        destructivo
        ocupado={accion.ocupado}
        error={accion.error}
        onCancelar={() => {
          setPorResucitar(null);
        }}
        onConfirmar={() => {
          if (porResucitar === null) return;
          revisar(porResucitar);
        }}
      />
    </>
  );
}
