// Rutas de productos (capa delgada).
const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { validar } = require("../middleware/validar");
const { requerirRol } = require("../middleware/auth");
const productosController = require("../controllers/productos.controller");
const { crearProductoSchema } = require("../validation/productos.schema");

const router = express.Router();

router.get("/", asyncHandler(productosController.listarActivos));

router.post(
    "/",
    requerirRol(1, 2),
    validar(crearProductoSchema),
    asyncHandler(productosController.crear)
);

module.exports = router;
