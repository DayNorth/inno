// Rutas de riesgos (capa delgada).
const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { validar } = require("../middleware/validar");
const { requerirRol } = require("../middleware/auth");
const riesgosController = require("../controllers/riesgos.controller");
const { crearRiesgoSchema } = require("../validation/riesgos.schema");

const router = express.Router();

router.get("/", asyncHandler(riesgosController.listar));

router.post(
    "/",
    requerirRol(1, 2),
    validar(crearRiesgoSchema),
    asyncHandler(riesgosController.crear)
);

module.exports = router;
