// Esquemas de validación de permisos. El único dato de entrada es el id_rol
// (param de ruta) y el id_permiso (body) al asignar/revocar.
const { z } = require("zod");
const { idParamSchema } = require("./comun.schema");

const idRolParam = idParamSchema("El ID del rol no es válido");

const asignarPermisoSchema = z.object({
    id_permiso: z.coerce
        .number({ message: "Debe indicar un permiso válido" })
        .int("Debe indicar un permiso válido")
        .positive("Debe indicar un permiso válido")
});

const idPermisoParam = idParamSchema("El ID del permiso no es válido");

// Param combinado para DELETE /roles/:id/:idPermiso.
const INT_MAX = 2147483647;
const idRolYPermisoParam = z.object({
    id: z.coerce
        .number({ message: "El ID del rol no es válido" })
        .int("El ID del rol no es válido")
        .positive("El ID del rol no es válido")
        .max(INT_MAX, "El ID del rol no es válido"),
    idPermiso: z.coerce
        .number({ message: "El ID del permiso no es válido" })
        .int("El ID del permiso no es válido")
        .positive("El ID del permiso no es válido")
        .max(INT_MAX, "El ID del permiso no es válido")
});

module.exports = {
    idRolParam,
    asignarPermisoSchema,
    idPermisoParam,
    idRolYPermisoParam
};
