// Rutas de plataformas (capa delgada, solo lectura).
const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const plataformasController = require("../controllers/plataformas.controller");

const router = express.Router();

router.get("/", asyncHandler(plataformasController.listar));

module.exports = router;
