// Esquemas de validación de proveedores. Mensajes y orden idénticos al legacy.
// Los criterios de evaluación se coercionan tipo Boolean(...) (cualquier valor
// truthy -> true, con "true"/"false" reconocidas explícitamente). El :id se
// valida con idParamSchema.
const { z } = require("zod");
const {
    idParamSchema,
    textoRequerido,
    textoOpcional,
    booleanoLaxo
} = require("./comun.schema");

const criteriosEvaluacion = {
    cifrado_datos: booleanoLaxo,
    mfa_disponible: booleanoLaxo,
    sla_definido: booleanoLaxo,
    certificaciones_vigentes: booleanoLaxo
};

// Topes reales de columna: ProveedorTecnologico.nombre_proveedor varchar(150),
// tipo_servicio varchar(150); PlanContingencia.escenario varchar(255),
// procedimiento_alterno varchar(500), responsable varchar(100).
const crearProveedorSchema = z.object({
    nombre_proveedor: textoRequerido(
        "El nombre del proveedor es obligatorio",
        150,
        "El nombre del proveedor no puede superar los 150 caracteres"
    ),
    tipo_servicio: textoOpcional(
        150,
        "El tipo de servicio no puede superar los 150 caracteres"
    ),
    ...criteriosEvaluacion
});

const idProveedorParam = idParamSchema("El ID del proveedor no es válido");

const crearEvaluacionSchema = z.object({
    ...criteriosEvaluacion
});

const crearPlanSchema = z.object({
    escenario: textoRequerido(
        "El escenario es obligatorio",
        255,
        "El escenario no puede superar los 255 caracteres"
    ),
    procedimiento_alterno: textoRequerido(
        "El procedimiento alterno es obligatorio",
        500,
        "El procedimiento alterno no puede superar los 500 caracteres"
    ),
    responsable: textoOpcional(
        100,
        "El responsable no puede superar los 100 caracteres"
    )
});

module.exports = {
    crearProveedorSchema,
    idProveedorParam,
    crearEvaluacionSchema,
    crearPlanSchema
};
