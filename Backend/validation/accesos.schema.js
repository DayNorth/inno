// Esquemas de validación de accesos. Orden y mensajes idénticos al legacy:
// usuario -> plataforma -> rol_acceso -> fecha_alta. El :id de revisar/revocar
// se valida con idParamSchema.
const { z } = require("zod");
const { idParamSchema, textoRequerido, fechaRequerida } = require("./comun.schema");

const idPositivo = (mensaje) =>
    z.coerce.number({ message: mensaje }).int(mensaje).positive(mensaje);

// Tope real de columna: AccesosPlataforma.rol_acceso varchar(100).
const crearAccesoSchema = z.object({
    id_usuario: idPositivo("Debe seleccionar un usuario válido"),
    id_plataforma: idPositivo("Debe seleccionar una plataforma válida"),
    rol_acceso: textoRequerido(
        "El rol de acceso es obligatorio",
        100,
        "El rol de acceso no puede superar los 100 caracteres"
    ),
    fecha_alta: fechaRequerida("La fecha de alta es obligatoria")
});

const idAccesoParam = idParamSchema("El ID del acceso no es válido");

module.exports = { crearAccesoSchema, idAccesoParam };
