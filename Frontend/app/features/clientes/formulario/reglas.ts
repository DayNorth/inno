import {
  formatoCorreo,
  formatoTelefono,
  largoMaximo,
  obligatorio,
  opcional,
  recortado,
  type Reglas,
} from "@/shared/formularios/tipos";
import {
  LARGOS_CLIENTE,
  type Cliente,
  type DatosCliente,
} from "../dominio/cliente";

/** Lo que el usuario teclea: todo string, porque eso entregan los <input>. */
export interface ClienteForm {
  nombre: string;
  pais: string;
  correo: string;
  telefono: string;
}

export const reglasCliente = {
  nombre: {
    ...obligatorio("El nombre del cliente"),
    ...largoMaximo(LARGOS_CLIENTE.nombre),
  },
  pais: largoMaximo(LARGOS_CLIENTE.pais),
  correo: {
    ...largoMaximo(LARGOS_CLIENTE.correo),
    // El backend valida longitud pero NO formato (contrato-api.md §3.3).
    // Esta es una restriccion propia, mas estricta que el servidor.
    ...formatoCorreo(),
  },
  telefono: {
    ...largoMaximo(LARGOS_CLIENTE.telefono),
    ...formatoTelefono(),
  },
} satisfies Reglas<ClienteForm>;

export const valoresInicialesCliente: ClienteForm = {
  nombre: "",
  pais: "",
  correo: "",
  telefono: "",
};

export const aFormulario = (c: Cliente): ClienteForm => ({
  nombre: c.nombre,
  pais: c.pais ?? "",
  correo: c.correo ?? "",
  telefono: c.telefono ?? "",
});

/**
 * Normalizacion explicita form -> payload. Sustituye a los `.transform()` de un
 * esquema: es una funcion pura y testeable, no una conversion escondida.
 */
export const aPayload = (f: ClienteForm): DatosCliente => ({
  nombre: recortado(f.nombre),
  pais: opcional(f.pais),
  correo: opcional(f.correo),
  telefono: opcional(f.telefono),
});
