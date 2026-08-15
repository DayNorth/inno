// Rutas de proveedores (capa delgada): solo montaje HTTP. Aplica middlewares
// (requerirRol, validación zod) y delega en el controller, envuelto en
// asyncHandler para que los errores lleguen al handler central sin try/catch.
// verificarToken se aplica al montar el router en app.js (identidad del token).
const express = require("express");
const { validar } = require("../middleware/validar");
const asyncHandler = require("../utils/asyncHandler");
const { requerirRol } = require("../middleware/auth");
const proveedoresController = require("../controllers/proveedores.controller");
const {
    crearProveedorSchema,
    idProveedorParam,
    crearEvaluacionSchema,
    crearPlanSchema
} = require("../validation/proveedores.schema");

const router = express.Router();

// Proveedores con su última evaluación.
router.get("/", asyncHandler(proveedoresController.listar));

// Proveedor por ID con historial de evaluaciones y planes de contingencia.
router.get(
    "/:id",
    validar(idProveedorParam, "params"),
    asyncHandler(proveedoresController.obtener)
);

// Crear proveedor con evaluación de seguridad inicial obligatoria.
router.post(
    "/",
    requerirRol(1, 2),
    validar(crearProveedorSchema),
    asyncHandler(proveedoresController.crear)
);

// Registrar una nueva evaluación de seguridad para un proveedor existente.
router.post(
    "/:id/evaluaciones",
    requerirRol(1, 2),
    validar(idProveedorParam, "params"),
    validar(crearEvaluacionSchema),
    asyncHandler(proveedoresController.registrarEvaluacion)
);

// Registrar un plan de contingencia para un proveedor.
router.post(
    "/:id/planes-contingencia",
    requerirRol(1, 2),
    validar(idProveedorParam, "params"),
    validar(crearPlanSchema),
    asyncHandler(proveedoresController.registrarPlan)
);

module.exports = router;
