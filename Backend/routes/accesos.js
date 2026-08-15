// Rutas de accesos (capa delgada). Revocar requiere rol 1; el resto rol 1 o 2.
const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { validar } = require("../middleware/validar");
const { requerirRol } = require("../middleware/auth");
const accesosController = require("../controllers/accesos.controller");
const { crearAccesoSchema, idAccesoParam } = require("../validation/accesos.schema");

const router = express.Router();

router.get("/", asyncHandler(accesosController.listar));

router.post(
    "/",
    requerirRol(1, 2),
    validar(crearAccesoSchema),
    asyncHandler(accesosController.crear)
);

router.patch(
    "/:id/revisar",
    requerirRol(1, 2),
    validar(idAccesoParam, "params"),
    asyncHandler(accesosController.revisar)
);

router.patch(
    "/:id/revocar",
    requerirRol(1),
    validar(idAccesoParam, "params"),
    asyncHandler(accesosController.revocar)
);

module.exports = router;
