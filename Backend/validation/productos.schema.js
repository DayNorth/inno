// Esquemas de validación de productos. Replican los mensajes en español y la
// normalización (trim) del router legacy.
const { z } = require("zod");
const { textoRequerido, textoOpcional } = require("./comun.schema");

// Topes reales de columna: Productos.nombre_producto varchar(150),
// descripcion varchar(255).
const crearProductoSchema = z.object({
    nombre_producto: textoRequerido(
        "El nombre del producto es obligatorio",
        150,
        "El nombre del producto no puede superar los 150 caracteres"
    ),
    descripcion: textoOpcional(255, "La descripción no puede superar los 255 caracteres")
});

module.exports = { crearProductoSchema };
