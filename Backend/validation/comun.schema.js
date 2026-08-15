// Esquemas y helpers de validación compartidos entre módulos. Solo se
// consolida aquí lo que varios archivos duplicaban literalmente; no es un
// framework de validación general.
const { z } = require("zod");

// Límite superior de un entero SQL Server `int` (mismo tipo que usan todas
// las columnas id_* del esquema, confirmado contra INFORMATION_SCHEMA.COLUMNS).
// Sin este tope, un id fuera de rango llega al driver mssql y revienta con un
// 500 crudo en vez de un 400 limpio.
const INT_MAX = 2147483647;

// Valida el parámetro de ruta :id como entero positivo dentro del rango de
// `int`. El mensaje se personaliza por módulo (p. ej. "El ID del cliente no
// es válido"); este es el genérico. Cada módulo puede definir el suyo con
// idParamSchema(mensaje).
function idParamSchema(mensaje = "El ID indicado no es válido") {
    return z.object({
        id: z.coerce
            .number({ message: mensaje })
            .int(mensaje)
            .positive(mensaje)
            .max(INT_MAX, mensaje)
    });
}

// Texto obligatorio con tope de longitud real de columna (VarChar(n)). Trim +
// min(1) + max(maxLen). maxLen y su mensaje son obligatorios a propósito: sin
// un tope, texto sobredimensionado llega al driver y revienta con un 500
// crudo en vez de un 400 limpio.
function textoRequerido(mensajeObligatorio, maxLen, mensajeLongitud) {
    return z
        .string({ message: mensajeObligatorio })
        .trim()
        .min(1, mensajeObligatorio)
        .max(maxLen, mensajeLongitud);
}

// Texto opcional: "" o solo espacios -> null tras trim; excede el tope -> error.
function textoOpcional(maxLen, mensajeLongitud) {
    return z
        .string()
        .trim()
        .max(maxLen, mensajeLongitud)
        .transform((v) => (v === "" ? null : v))
        .nullish()
        .transform((v) => v ?? null);
}

// Coerción laxa de booleanos tipo Boolean(...) del legacy (cualquier valor
// truthy -> true), PERO reconociendo explícitamente las cadenas "true"/"false".
// Sin este caso especial, Boolean("false") === true y un cliente que manda la
// cadena "false" activaría el flag en vez de desactivarlo; estos campos
// alimentan estado_seguridad (Dispositivos) y el puntaje/nivel de riesgo de
// proveedores (VinkaGuard), así que la inversión silenciosa es de seguridad.
const booleanoLaxo = z
    .any()
    .transform((v) => {
        if (typeof v === "string") {
            const normalizado = v.trim().toLowerCase();
            if (normalizado === "false") return false;
            if (normalizado === "true") return true;
        }
        return Boolean(v);
    })
    .default(false);

// Fecha obligatoria: rechaza vacío/falsy igual que el legacy (Boolean(v) del
// valor crudo) y además valida que lo enviado sea una fecha real ANTES de
// castear a sql.Date/DateTime — si no, el driver revienta con un 500 crudo en
// vez de un 400 limpio. OJO: z.coerce.date() por sí solo acepta null/false/0
// como "1970-01-01" en vez de fallar, de ahí el refine previo.
function fechaRequerida(mensaje) {
    return z
        .any()
        .refine((v) => Boolean(v), mensaje)
        .pipe(z.coerce.date({ message: mensaje }));
}

// Fecha opcional: falsy/ausente -> null (se preserva el default que aplica el
// service); si viene, debe ser una fecha real. El `.default(null)` final no es
// cosmético: sin él, zod v4 exige que la clave esté presente en el body (la
// marca como "nonoptional") aunque el propio pipeline ya sepa mapear
// undefined -> null; con `.default(null)` la clave puede faltar del todo.
function fechaOpcional(mensaje = "La fecha indicada no es válida") {
    return z
        .any()
        .transform((v) => (v ? v : null))
        .pipe(z.coerce.date({ message: mensaje }).nullable())
        .default(null);
}

// Estados válidos de Pedidos.estado (varchar(30), sin CHECK en BD): el
// allow-list vive acá para que creación, actualización y cambio de estado no
// lo dupliquen cada uno por su lado.
const ESTADOS_PEDIDO = ["Pendiente", "En proceso", "Completado", "Cancelado"];
// Subconjunto sin "Cancelado": para eso está el endpoint dedicado /cancelar.
const ESTADOS_PEDIDO_CAMBIO = ["Pendiente", "En proceso", "Completado"];

module.exports = {
    idParamSchema,
    textoRequerido,
    textoOpcional,
    booleanoLaxo,
    fechaRequerida,
    fechaOpcional,
    ESTADOS_PEDIDO,
    ESTADOS_PEDIDO_CAMBIO
};
