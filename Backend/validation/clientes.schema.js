// Esquemas de validación del módulo clientes. Replican EXACTAMENTE los
// mensajes en español que hoy devuelve cada endpoint, y normalizan (trim)
// de forma declarativa lo que antes se hacía a mano.
const { z } = require("zod");
const { idParamSchema, textoRequerido, textoOpcional } = require("./comun.schema");

const idClienteParam = idParamSchema("El ID del cliente no es válido");

// Topes reales de columna: Clientes.nombre varchar(150), pais varchar(100),
// correo varchar(100), telefono varchar(30).
const crearClienteSchema = z.object({
    nombre: textoRequerido(
        "El nombre del cliente es obligatorio",
        150,
        "El nombre del cliente no puede superar los 150 caracteres"
    ),
    pais: textoOpcional(100, "El país no puede superar los 100 caracteres"),
    correo: textoOpcional(100, "El correo no puede superar los 100 caracteres"),
    telefono: textoOpcional(30, "El teléfono no puede superar los 30 caracteres")
});

const actualizarClienteSchema = crearClienteSchema;

module.exports = {
    crearClienteSchema,
    actualizarClienteSchema,
    idClienteParam
};
