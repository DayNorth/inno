// Rutas de dispositivos (capa delgada).
const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { validar } = require("../middleware/validar");
const { requerirRol } = require("../middleware/auth");
const dispositivosController = require("../controllers/dispositivos.controller");
const { crearDispositivoSchema } = require("../validation/dispositivos.schema");

const router = express.Router();

router.get("/", asyncHandler(dispositivosController.listar));

router.post(
    "/",
    requerirRol(1, 2),
    validar(crearDispositivoSchema),
    asyncHandler(dispositivosController.crear)
);

module.exports = router;
