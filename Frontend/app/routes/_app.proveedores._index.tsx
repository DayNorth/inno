import { useState } from "react";
import type { Route } from "./+types/_app.proveedores._index";
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
  crearProveedor,
  listarProveedores,
} from "@/features/proveedores/api/proveedoresApi";
import type { DatosProveedor } from "@/features/proveedores/dominio/proveedor";
import { ProveedorFormulario } from "@/features/proveedores/components/ProveedorFormulario";
import { ProveedoresTabla } from "@/features/proveedores/components/ProveedoresTabla";

export function meta() {
  return [{ title: "Proveedores · VinkaPlant" }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const usuario = await requerirSesion(request);
  return {
    proveedores: await listarProveedores(request.signal),
    puedeEscribir: ROLES_ESCRITURA.includes(usuario.id_rol),
  };
}

interface PeticionProveedor {
  readonly datos: DatosProveedor;
}

export async function clientAction({
  request,
}: Route.ClientActionArgs): Promise<ResultadoAccion> {
  await requerirSesion(request);
  const peticion = (await request.json()) as PeticionProveedor;
  return ejecutarAccion(() => crearProveedor(peticion.datos));
}

export default function Proveedores({ loaderData }: Route.ComponentProps) {
  const { proveedores, puedeEscribir } = loaderData;
  const accion = useAccion("proveedores");
  const [pedido, setPedido] = useState(false);
  const abierto = pedido && !accion.exito;

  const { filtro, setFiltro, resultado } = useFiltroTabla(proveedores, (p) => [
    p.nombre_proveedor,
    p.tipo_servicio,
    p.estado_contrato,
    p.resultado,
    p.nivel_riesgo,
  ]);

  return (
    <>
      <EncabezadoPagina
        titulo="Proveedores"
        subtitulo="Evaluaciones de seguridad y planes de contingencia."
        acciones={
          puedeEscribir && (
            <Boton
              variante="primario"
              onClick={() => {
                accion.reiniciar();
                setPedido(true);
              }}
            >
              + Evaluar proveedor
            </Boton>
          )
        }
      />

      {accion.exito && <Alert tono="exito">{accion.resultado?.mensaje}</Alert>}
      {accion.error !== null && !abierto && (
        <Alert tono="error">{accion.error}</Alert>
      )}

      {proveedores.length === 0 ? (
        <EstadoVacio
          titulo="No hay proveedores registrados"
          detalle="Registrar un proveedor implica evaluarlo: la evaluacion inicial es obligatoria."
        />
      ) : (
        <>
          <ToolbarTabla
            filtro={filtro}
            onFiltroChange={setFiltro}
            etiquetaBusqueda="Buscar por proveedor, tipo, contrato o resultado"
            mostrando={resultado.length}
            total={proveedores.length}
          />
          {resultado.length === 0 ? (
            <EstadoVacio
              titulo="Sin resultados"
              detalle={`Ningun proveedor coincide con "${filtro}".`}
            />
          ) : (
            <ProveedoresTabla proveedores={resultado} />
          )}
        </>
      )}

      <Modal
        abierto={abierto}
        titulo="Evaluar proveedor"
        descripcion="El alta incluye la evaluacion inicial, obligatoria por contrato."
        onCerrar={() => {
          setPedido(false);
        }}
      >
        <ProveedorFormulario
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
