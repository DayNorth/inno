// Rutas de bitácora (capa delgada, solo lectura). El control de rol (1,3) se
// aplica al montar el router en app.js (requerirRol).
const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const bitacoraController = require("../controllers/bitacora.controller");

const router = express.Router();

router.get("/", asyncHandler(bitacoraController.listar));

module.exports = router;
