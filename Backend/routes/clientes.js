// Rutas de clientes (capa delgada): solo montaje HTTP. Aplica middlewares
// (requerirRol, validación zod) y delega en el controller, envuelto en
// asyncHandler para que los errores lleguen al handler central sin try/catch.
// verificarToken se aplica al montar el router en app.js (identidad del token).
const express = require("express");
const { validar } = require("../middleware/validar");
const asyncHandler = require("../utils/asyncHandler");
const { requerirRol } = require("../middleware/auth");
const clientesController = require("../controllers/clientes.controller");
const {
    crearClienteSchema,
    actualizarClienteSchema,
    idClienteParam
} = require("../validation/clientes.schema");

const router = express.Router();

// Clientes activos.
router.get("/", asyncHandler(clientesController.listarActivos));

// Todos los clientes (activos e inactivos). Debe ir antes de "/:id".
router.get("/todos", asyncHandler(clientesController.listarTodos));

// Cliente por ID.
router.get(
    "/:id",
    validar(idClienteParam, "params"),
    asyncHandler(clientesController.obtenerPorId)
);

// Crear cliente.
router.post(
    "/",
    requerirRol(1, 2),
    validar(crearClienteSchema),
    asyncHandler(clientesController.crear)
);

// Actualizar cliente. El ID se valida antes que el cuerpo (mismo orden que el
// legacy: primero el error de ID, luego el de nombre).
router.put(
    "/:id",
    requerirRol(1, 2),
    validar(idClienteParam, "params"),
    validar(actualizarClienteSchema),
    asyncHandler(clientesController.actualizar)
);

// Inactivar cliente (baja lógica).
router.patch(
    "/:id/inactivar",
    requerirRol(1, 2),
    validar(idClienteParam, "params"),
    asyncHandler(clientesController.inactivar)
);

// Reactivar cliente (alta lógica).
router.patch(
    "/:id/reactivar",
    requerirRol(1, 2),
    validar(idClienteParam, "params"),
    asyncHandler(clientesController.reactivar)
);

module.exports = router;
