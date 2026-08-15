// Rutas de pedidos (capa delgada). "/:id" para GET va después de "/" (Express
// resuelve por orden de registro; no hay ruta literal que colisione aquí).
const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { validar } = require("../middleware/validar");
const { requerirRol } = require("../middleware/auth");
const pedidosController = require("../controllers/pedidos.controller");
const {
    crearPedidoSchema,
    actualizarPedidoSchema,
    cambiarEstadoSchema,
    idPedidoParam
} = require("../validation/pedidos.schema");

const router = express.Router();

router.get("/", asyncHandler(pedidosController.listar));

router.get(
    "/:id",
    validar(idPedidoParam, "params"),
    asyncHandler(pedidosController.obtener)
);

router.post(
    "/",
    requerirRol(1, 2),
    validar(crearPedidoSchema),
    asyncHandler(pedidosController.crear)
);

router.put(
    "/:id",
    requerirRol(1, 2),
    validar(idPedidoParam, "params"),
    validar(actualizarPedidoSchema),
    asyncHandler(pedidosController.actualizar)
);

router.patch(
    "/:id/estado",
    requerirRol(1, 2),
    validar(idPedidoParam, "params"),
    validar(cambiarEstadoSchema),
    asyncHandler(pedidosController.cambiarEstado)
);

router.patch(
    "/:id/cancelar",
    requerirRol(1, 2),
    validar(idPedidoParam, "params"),
    asyncHandler(pedidosController.cancelar)
);

module.exports = router;
