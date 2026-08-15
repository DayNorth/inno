// Rutas de incidentes (capa delgada).
const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { validar } = require("../middleware/validar");
const { requerirRol } = require("../middleware/auth");
const incidentesController = require("../controllers/incidentes.controller");
const {
    crearIncidenteSchema,
    idIncidenteParam,
    resolverIncidenteSchema
} = require("../validation/incidentes.schema");

const router = express.Router();

router.get("/", asyncHandler(incidentesController.listar));

router.post(
    "/",
    requerirRol(1, 2),
    validar(crearIncidenteSchema),
    asyncHandler(incidentesController.reportar)
);

router.patch(
    "/:id/resolver",
    requerirRol(1, 2),
    validar(idIncidenteParam, "params"),
    validar(resolverIncidenteSchema),
    asyncHandler(incidentesController.resolver)
);

module.exports = router;
