// Esquemas de validación de pedidos. Replican EXACTAMENTE el orden y los
// mensajes del router legacy:
//   crear: id_cliente -> detalles no vacío -> por cada detalle
//          (id_producto -> cantidad -> precio_unitario).
//   actualizar: id (param) -> id_cliente -> fecha -> estado -> estado válido.
//   estado (PATCH): id (param) -> estado válido (subconjunto sin Cancelado).
const { z } = require("zod");
const {
    idParamSchema,
    fechaRequerida,
    fechaOpcional,
    ESTADOS_PEDIDO,
    ESTADOS_PEDIDO_CAMBIO
} = require("./comun.schema");

const idPositivo = (mensaje) =>
    z.coerce.number({ message: mensaje }).int(mensaje).positive(mensaje);

// Topes reales de columna: DetallePedido.precio_unitario es decimal(12,2);
// DetallePedido.subtotal (columna computada PERSISTED = cantidad *
// precio_unitario, CONVERT a decimal(14,2)) revienta con un error aritmético
// crudo si el producto excede ese rango, así que además del tope por campo se
// valida la combinación contra el tope real del subtotal.
const CANTIDAD_MAX = 2147483647; // límite del sql.Int con el que se liga cantidad
const PRECIO_UNITARIO_MAX = 9999999999.99; // tope real de decimal(12,2)
const SUBTOTAL_MAX = 999999999999.99; // tope real de decimal(14,2)

// Un detalle de pedido: producto, cantidad y precio. El orden de los campos
// determina el issue[0] cuando varios fallan, igual que el bucle legacy.
const detalleSchema = z
    .object({
        id_producto: idPositivo("Existe un producto inválido"),
        cantidad: idPositivo("La cantidad debe ser mayor que cero").max(
            CANTIDAD_MAX,
            "La cantidad supera el máximo permitido"
        ),
        precio_unitario: z.coerce
            .number({ message: "El precio unitario no es válido" })
            .finite("El precio unitario no es válido")
            .nonnegative("El precio unitario no es válido")
            .max(
                PRECIO_UNITARIO_MAX,
                "El precio unitario supera el máximo permitido"
            )
    })
    .refine(
        (d) => d.cantidad * d.precio_unitario <= SUBTOTAL_MAX,
        "El subtotal de la línea supera el máximo permitido"
    );

const crearPedidoSchema = z.object({
    id_cliente: idPositivo("Debe seleccionar un cliente válido"),
    // fecha y estado son opcionales; el service aplica los defaults
    // (new Date() y "Pendiente") para preservar el comportamiento legacy.
    fecha: fechaOpcional("La fecha indicada no es válida"),
    // Optativo: si no se manda (o llega vacío/solo-espacios) el service aplica
    // "Pendiente"; si se manda, debe ser uno de los estados válidos (evita que
    // el cliente arranque un pedido en un estado arbitrario y salte la máquina
    // de estados que sí aplican actualizar/cambiarEstado).
    estado: z
        .string()
        .trim()
        .optional()
        .refine(
            (v) => !v || ESTADOS_PEDIDO_CAMBIO.includes(v),
            "El estado indicado no es válido"
        ),
    detalles: z
        .array(detalleSchema, {
            message: "El pedido debe incluir al menos una planta"
        })
        .min(1, "El pedido debe incluir al menos una planta")
});

const idPedidoParam = idParamSchema("El ID del pedido no es válido");

const actualizarPedidoSchema = z.object({
    id_cliente: idPositivo("Debe seleccionar un cliente válido"),
    fecha: fechaRequerida("La fecha es obligatoria"),
    estado: z
        .string({ message: "El estado es obligatorio" })
        .trim()
        .min(1, "El estado es obligatorio")
        .refine(
            (v) => ESTADOS_PEDIDO.includes(v),
            "El estado indicado no es válido"
        )
});

// Estados válidos para el cambio de estado (PATCH /:id/estado): NO incluye
// Cancelado (para eso está /:id/cancelar). Mensaje único del legacy.
const cambiarEstadoSchema = z.object({
    estado: z
        .string({ message: "El estado indicado no es válido" })
        .trim()
        .refine(
            (v) => ESTADOS_PEDIDO_CAMBIO.includes(v),
            "El estado indicado no es válido"
        )
});

module.exports = {
    crearPedidoSchema,
    actualizarPedidoSchema,
    cambiarEstadoSchema,
    idPedidoParam
};
