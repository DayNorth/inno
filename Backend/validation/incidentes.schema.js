// Esquemas de validación de incidentes. Orden y mensajes idénticos al legacy:
// plataforma -> responsable -> título -> fecha_inicio. La resolución valida el
// :id y toma fecha_resolucion opcional (default new Date() en el service).
const { z } = require("zod");
const {
    idParamSchema,
    textoRequerido,
    textoOpcional,
    fechaRequerida,
    fechaOpcional
} = require("./comun.schema");

const idPositivo = (mensaje) =>
    z.coerce.number({ message: mensaje }).int(mensaje).positive(mensaje);

// Topes reales de columna: Incidentes.titulo varchar(150),
// procedimiento_alterno varchar(500).
const crearIncidenteSchema = z.object({
    id_plataforma: idPositivo("Debe seleccionar una plataforma válida"),
    id_usuario_responsable: idPositivo("Debe seleccionar un responsable válido"),
    titulo: textoRequerido(
        "El título del incidente es obligatorio",
        150,
        "El título del incidente no puede superar los 150 caracteres"
    ),
    fecha_inicio: fechaRequerida("La fecha de inicio es obligatoria"),
    procedimiento_alterno: textoOpcional(
        500,
        "El procedimiento alterno no puede superar los 500 caracteres"
    )
});

const idIncidenteParam = idParamSchema("El ID del incidente no es válido");

// Cuerpo opcional de la resolución: fecha_resolucion opcional, pero si viene
// debe ser una fecha real (antes de castear a sql.DateTime).
const resolverIncidenteSchema = z.object({
    fecha_resolucion: fechaOpcional("La fecha de resolución no es válida")
});

module.exports = {
    crearIncidenteSchema,
    idIncidenteParam,
    resolverIncidenteSchema
};
