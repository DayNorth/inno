// Rutas de documentos (capa delgada). Roles segun la matriz del contrato:
// leer = cualquier autenticado, subir = 1 o 2, eliminar = solo 1 (mismo criterio
// que revocar accesos: la operacion destructiva se reserva al Administrador).
const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { validar } = require("../middleware/validar");
const { requerirRol } = require("../middleware/auth");
const { subirDocumento } = require("../middleware/subirArchivo");
const { limitadorSubida } = require("../middleware/limitadores");
const documentosController = require("../controllers/documentos.controller");
const {
    crearDocumentoSchema,
    idDocumentoParam
} = require("../validation/documentos.schema");

const router = express.Router();

router.get("/", asyncHandler(documentosController.listar));

router.get(
    "/:id/descargar",
    validar(idDocumentoParam, "params"),
    asyncHandler(documentosController.descargar)
);

// Orden del pipeline, y ninguno de los pasos es intercambiable:
//   requerirRol -> rechaza al auditor ANTES de escribir un byte en disco,
//   limitadorSubida -> corta la ráfaga antes de que multer toque el disco; va
//     tras requerirRol para que un 403 no consuma cupo de subida, y cuenta por
//     usuario porque aquí la petición ya pasó por verificarToken,
//   subirDocumento -> parsea el multipart y aplica tamaño/cantidad/tipo,
//   validar -> los ids del formulario, que solo existen tras parsear multipart.
router.post(
    "/",
    requerirRol(1, 2),
    limitadorSubida,
    subirDocumento,
    validar(crearDocumentoSchema),
    asyncHandler(documentosController.crear)
);

router.delete(
    "/:id",
    requerirRol(1),
    validar(idDocumentoParam, "params"),
    asyncHandler(documentosController.eliminar)
);

module.exports = router;
