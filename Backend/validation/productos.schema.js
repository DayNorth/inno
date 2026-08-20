// Esquemas de validación de productos. Replican los mensajes en español y la
// normalización (trim) del router legacy.
const { z } = require("zod");
const {
    textoRequerido,
    textoOpcional,
    idParamSchema
} = require("./comun.schema");

// Catálogo cerrado de estado fitosanitario. "Sano" es el default en BD
// (DF_Productos_EstadoFitosanitario); el resto refleja los estados que
// maneja control de calidad para plantas de exportación.
const ESTADOS_FITOSANITARIOS = [
    "Sano",
    "En observación",
    "En tratamiento",
    "Rechazado"
];

// cantidad_disponible es int en BD con CHECK >= 0.
const CANTIDAD_MAX = 2147483647;
const cantidadDisponible = () =>
    z.coerce
        .number({
            message: "La cantidad disponible debe ser un número"
        })
        .int("La cantidad disponible debe ser un número entero")
        .min(0, "La cantidad disponible no puede ser negativa")
        .max(
            CANTIDAD_MAX,
            "La cantidad disponible supera el máximo permitido"
        )
        .optional()
        .default(0);

const estadoFitosanitario = () =>
    z
        .string()
        .trim()
        .optional()
        .transform((v) => (v ? v : "Sano"))
        .refine(
            (v) => ESTADOS_FITOSANITARIOS.includes(v),
            "El estado fitosanitario indicado no es válido"
        );

// Topes reales de columna: Productos.nombre_producto varchar(150),
// descripcion varchar(255), ubicacion_invernadero varchar(100).
const crearProductoSchema = z.object({
    nombre_producto: textoRequerido(
        "El nombre del producto es obligatorio",
        150,
        "El nombre del producto no puede superar los 150 caracteres"
    ),
    descripcion: textoOpcional(255, "La descripción no puede superar los 255 caracteres"),
    cantidad_disponible: cantidadDisponible(),
    estado_fitosanitario: estadoFitosanitario(),
    ubicacion_invernadero: textoOpcional(
        100,
        "La ubicación del invernadero no puede superar los 100 caracteres"
    )
});

// Actualizar: mismos campos que crear (reemplaza los valores existentes);
// cantidad_disponible y estado_fitosanitario son obligatorios aquí (a
// diferencia de crear, donde tienen default) para que una edición no borre
// silenciosamente el inventario por omitir el campo.
const actualizarProductoSchema = z.object({
    nombre_producto: textoRequerido(
        "El nombre del producto es obligatorio",
        150,
        "El nombre del producto no puede superar los 150 caracteres"
    ),
    descripcion: textoOpcional(255, "La descripción no puede superar los 255 caracteres"),
    cantidad_disponible: z.coerce
        .number({ message: "La cantidad disponible es obligatoria" })
        .int("La cantidad disponible debe ser un número entero")
        .min(0, "La cantidad disponible no puede ser negativa")
        .max(CANTIDAD_MAX, "La cantidad disponible supera el máximo permitido"),
    estado_fitosanitario: z
        .string({ message: "El estado fitosanitario es obligatorio" })
        .trim()
        .min(1, "El estado fitosanitario es obligatorio")
        .refine(
            (v) => ESTADOS_FITOSANITARIOS.includes(v),
            "El estado fitosanitario indicado no es válido"
        ),
    ubicacion_invernadero: textoOpcional(
        100,
        "La ubicación del invernadero no puede superar los 100 caracteres"
    )
});

const idProductoParam = idParamSchema("El ID del producto no es válido");

module.exports = {
    crearProductoSchema,
    actualizarProductoSchema,
    idProductoParam,
    ESTADOS_FITOSANITARIOS
};