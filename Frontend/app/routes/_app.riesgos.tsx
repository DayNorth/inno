import { useState } from "react";
import type { Route } from "./+types/_app.riesgos";
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
import { crearRiesgo, listarRiesgos } from "@/features/riesgos/api/riesgosApi";
import type { DatosRiesgo } from "@/features/riesgos/dominio/riesgo";
import { RiesgoFormulario } from "@/features/riesgos/components/RiesgoFormulario";
import { RiesgosTabla } from "@/features/riesgos/components/RiesgosTabla";

export function meta() {
  return [{ title: "Riesgos · VinkaPlant" }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const usuario = await requerirSesion(request);
  return {
    riesgos: await listarRiesgos(request.signal),
    puedeEscribir: ROLES_ESCRITURA.includes(usuario.id_rol),
  };
}

interface PeticionRiesgo {
  readonly datos: DatosRiesgo;
}

export async function clientAction({
  request,
}: Route.ClientActionArgs): Promise<ResultadoAccion> {
  await requerirSesion(request);
  const peticion = (await request.json()) as PeticionRiesgo;
  return ejecutarAccion(() => crearRiesgo(peticion.datos));
}

export default function Riesgos({ loaderData }: Route.ComponentProps) {
  const { riesgos, puedeEscribir } = loaderData;
  const accion = useAccion("riesgos");
  const [pedido, setPedido] = useState(false);
  const abierto = pedido && !accion.exito;

  const { filtro, setFiltro, resultado } = useFiltroTabla(riesgos, (r) => [
    r.sistema,
    r.categoria,
    r.descripcion,
    r.control_mitigante,
  ]);

  return (
    <>
      <EncabezadoPagina
        titulo="Riesgos"
        subtitulo="Matriz de riesgos de los sistemas, ordenada por criticidad."
        acciones={
          puedeEscribir && (
            <Boton
              variante="primario"
              onClick={() => {
                accion.reiniciar();
                setPedido(true);
              }}
            >
              + Registrar riesgo
            </Boton>
          )
        }
      />

      {accion.exito && <Alert tono="exito">{accion.resultado?.mensaje}</Alert>}
      {accion.error !== null && !abierto && (
        <Alert tono="error">{accion.error}</Alert>
      )}

      {riesgos.length === 0 ? (
        <EstadoVacio
          titulo="No hay riesgos registrados"
          detalle="Registra el primero para empezar la matriz."
        />
      ) : (
        <>
          <ToolbarTabla
            filtro={filtro}
            onFiltroChange={setFiltro}
            etiquetaBusqueda="Buscar por sistema, categoria o descripcion"
            mostrando={resultado.length}
            total={riesgos.length}
          />
          {resultado.length === 0 ? (
            <EstadoVacio
              titulo="Sin resultados"
              detalle={`Ningun riesgo coincide con "${filtro}".`}
            />
          ) : (
            <RiesgosTabla riesgos={resultado} />
          )}
        </>
      )}

      <Modal
        abierto={abierto}
        titulo="Registrar riesgo"
        descripcion="La criticidad se calcula como probabilidad x impacto."
        onCerrar={() => {
          setPedido(false);
        }}
      >
        <RiesgoFormulario
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
