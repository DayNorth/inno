import { Link } from "react-router";
import { RUTAS } from "@/rutas";
import { EncabezadoPagina } from "@/shared/ui/EncabezadoPagina/EncabezadoPagina";
import { EstadoVacio } from "@/shared/ui/EstadoVacio/EstadoVacio";

export function meta() {
  return [{ title: "Pagina no encontrada · VinkaPlant" }];
}

export default function NoEncontrado() {
  return (
    <main>
      <EncabezadoPagina titulo="404" />
      <EstadoVacio
        titulo="Esta pagina no existe"
        detalle="Comprueba la direccion o vuelve al inicio."
      >
        <Link to={RUTAS.inicio}>Ir al inicio</Link>
      </EstadoVacio>
    </main>
  );
}
