// Rutas de productos (capa delgada).
const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { validar } = require("../middleware/validar");
const { requerirRol } = require("../middleware/auth");
const productosController = require("../controllers/productos.controller");
const {
    crearProductoSchema,
    actualizarProductoSchema,
    idProductoParam
} = require("../validation/productos.schema");

const router = express.Router();

router.get("/", asyncHandler(productosController.listarActivos));

// Todos los productos (activos e inactivos). Debe ir antes de "/:id".
router.get("/todos", asyncHandler(productosController.listarTodos));

router.get(
    "/:id",
    validar(idProductoParam, "params"),
    asyncHandler(productosController.obtenerPorId)
);

router.post(
    "/",
    requerirRol(1, 2),
    validar(crearProductoSchema),
    asyncHandler(productosController.crear)
);

router.put(
    "/:id",
    requerirRol(1, 2),
    validar(idProductoParam, "params"),
    validar(actualizarProductoSchema),
    asyncHandler(productosController.actualizar)
);

router.patch(
    "/:id/inactivar",
    requerirRol(1, 2),
    validar(idProductoParam, "params"),
    asyncHandler(productosController.inactivar)
);

router.patch(
    "/:id/reactivar",
    requerirRol(1, 2),
    validar(idProductoParam, "params"),
    asyncHandler(productosController.reactivar)
);

module.exports = router;
