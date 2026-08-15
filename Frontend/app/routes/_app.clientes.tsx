import { useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/_app.clientes";
import { requerirSesion } from "@/shared/auth/requerir";
import { ROLES_ESCRITURA } from "@/shared/tipos/rol";
import { ejecutarAccion, type ResultadoAccion } from "@/shared/api/resultado";
import { useAccion } from "@/shared/api/useAccion";
import { Alert } from "@/shared/ui/Alert/Alert";
import { Boton } from "@/shared/ui/Boton/Boton";
import { EncabezadoPagina } from "@/shared/ui/EncabezadoPagina/EncabezadoPagina";
import { EstadoVacio } from "@/shared/ui/EstadoVacio/EstadoVacio";
import { Modal } from "@/shared/ui/Modal/Modal";
import { ModalConfirmacion } from "@/shared/ui/Modal/ModalConfirmacion";
import { ToolbarTabla } from "@/shared/ui/Tabla/ToolbarTabla";
import { useFiltroTabla } from "@/shared/ui/Tabla/useFiltroTabla";
import { idCliente } from "@/shared/tipos/marca";
import {
  actualizarCliente,
  crearCliente,
  inactivarCliente,
  listarClientes,
  listarTodosLosClientes,
  reactivarCliente,
} from "@/features/clientes/api/clientesApi";
import type { Cliente, DatosCliente } from "@/features/clientes/dominio/cliente";
import { ClienteFormulario } from "@/features/clientes/components/ClienteFormulario";
import { ClientesTabla } from "@/features/clientes/components/ClientesTabla";

export function meta() {
  return [{ title: "Clientes · VinkaPlant" }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const usuario = await requerirSesion(request);
  const incluirInactivos =
    new URL(request.url).searchParams.get("inactivos") === "1";

  const clientes = incluirInactivos
    ? await listarTodosLosClientes(request.signal)
    : await listarClientes(request.signal);

  return {
    clientes,
    incluirInactivos,
    puedeEscribir: ROLES_ESCRITURA.includes(usuario.id_rol),
  };
}

/** Payloads que envia esta pantalla. Los construye su propio componente. */
type PeticionClientes =
  | { readonly intencion: "crear"; readonly datos: DatosCliente }
  | {
      readonly intencion: "actualizar";
      readonly id: number;
      readonly datos: DatosCliente;
    }
  | { readonly intencion: "inactivar"; readonly id: number }
  | { readonly intencion: "reactivar"; readonly id: number };

export async function clientAction({
  request,
}: Route.ClientActionArgs): Promise<ResultadoAccion> {
  await requerirSesion(request);
  const peticion = (await request.json()) as PeticionClientes;

  return ejecutarAccion(async () => {
    switch (peticion.intencion) {
      case "crear":
        return await crearCliente(peticion.datos);
      case "actualizar":
        return await actualizarCliente(idCliente(peticion.id), peticion.datos);
      case "inactivar":
        return await inactivarCliente(idCliente(peticion.id));
      case "reactivar":
        return await reactivarCliente(idCliente(peticion.id));
    }
  });
}

export default function Clientes({ loaderData }: Route.ComponentProps) {
  const { clientes, incluirInactivos, puedeEscribir } = loaderData;
  const accion = useAccion("clientes");

  const [formularioPedido, setFormularioPedido] = useState(false);
  const [enEdicion, setEnEdicion] = useState<Cliente | null>(null);
  const [porCambiarEstado, setPorCambiarEstado] = useState<Cliente | null>(null);

  const { filtro, setFiltro, resultado } = useFiltroTabla(clientes, (c) => [
    c.nombre,
    c.pais,
    c.correo,
    c.telefono,
  ]);

  // Los dialogos se CIERRAN al salir bien la escritura, sin efecto de por medio:
  // el estado abierto se deriva del resultado (ver `useAccion`).
  const formularioAbierto = formularioPedido && !accion.exito;
  const confirmacionAbierta = porCambiarEstado !== null && !accion.exito;

  const abrirFormulario = (cliente: Cliente | null): void => {
    accion.reiniciar();
    setEnEdicion(cliente);
    setFormularioPedido(true);
  };

  const enviar = (cuerpo: PeticionClientes): void => {
    accion.enviar(cuerpo);
  };

  return (
    <>
      <EncabezadoPagina
        titulo="Clientes"
        subtitulo="Catalogo de clientes de VinkaPlant."
        acciones={
          puedeEscribir && (
            <Boton
              variante="primario"
              onClick={() => {
                abrirFormulario(null);
              }}
            >
              + Nuevo cliente
            </Boton>
          )
        }
      />

      {accion.exito && <Alert tono="exito">{accion.resultado?.mensaje}</Alert>}
      {accion.error !== null && porCambiarEstado === null && (
        <Alert tono="error">{accion.error}</Alert>
      )}

      <p>
        <Link to={incluirInactivos ? "/clientes" : "/clientes?inactivos=1"}>
          {incluirInactivos ? "Ver solo activos" : "Ver tambien inactivos"}
        </Link>
      </p>

      {clientes.length === 0 ? (
        <EstadoVacio
          titulo="Todavia no hay clientes"
          detalle="Registra el primero con el boton de arriba."
        />
      ) : (
        <>
          <ToolbarTabla
            filtro={filtro}
            onFiltroChange={setFiltro}
            etiquetaBusqueda="Buscar por nombre, pais, correo o telefono"
            mostrando={resultado.length}
            total={clientes.length}
          />
          {resultado.length === 0 ? (
            <EstadoVacio
              titulo="Sin resultados"
              detalle={`Ningun cliente coincide con "${filtro}".`}
            />
          ) : (
            <ClientesTabla
              clientes={resultado}
              puedeEditar={puedeEscribir}
              ocupado={accion.ocupado}
              onEditar={abrirFormulario}
              onCambiarEstado={(c) => {
                accion.reiniciar();
                setPorCambiarEstado(c);
              }}
            />
          )}
        </>
      )}

      <Modal
        abierto={formularioAbierto}
        titulo={enEdicion === null ? "Nuevo cliente" : "Editar cliente"}
        onCerrar={() => {
          setFormularioPedido(false);
        }}
      >
        <ClienteFormulario
          clienteEnEdicion={enEdicion}
          guardando={accion.ocupado}
          errorServidor={accion.error}
          onCancelar={() => {
            setFormularioPedido(false);
          }}
          onGuardar={(datos) => {
            enviar(
              enEdicion === null
                ? { intencion: "crear", datos }
                : { intencion: "actualizar", id: enEdicion.id_cliente, datos },
            );
          }}
        />
      </Modal>

      <ModalConfirmacion
        abierto={confirmacionAbierta}
        titulo={
          porCambiarEstado?.estado === "Activo"
            ? "Inactivar cliente"
            : "Reactivar cliente"
        }
        mensaje={
          porCambiarEstado === null
            ? ""
            : `${porCambiarEstado.estado === "Activo" ? "Se inactivara" : "Se reactivara"} el cliente "${porCambiarEstado.nombre}".`
        }
        textoConfirmar={
          porCambiarEstado?.estado === "Activo" ? "Inactivar" : "Reactivar"
        }
        destructivo={porCambiarEstado?.estado === "Activo"}
        ocupado={accion.ocupado}
        error={accion.error}
        onCancelar={() => {
          setPorCambiarEstado(null);
        }}
        onConfirmar={() => {
          if (porCambiarEstado === null) return;
          enviar({
            intencion:
              porCambiarEstado.estado === "Activo" ? "inactivar" : "reactivar",
            id: porCambiarEstado.id_cliente,
          });
        }}
      />
    </>
  );
}
