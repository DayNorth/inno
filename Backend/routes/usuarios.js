// Rutas de usuarios (capa delgada). GET /api/usuarios es auth-para-todos
// (ADR-001): alimenta selects de responsable, no expone contraseñas.
const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { validar } = require("../middleware/validar");
const { requerirRol } = require("../middleware/auth");
const { idParamSchema } = require("../validation/comun.schema");
const usuariosController = require("../controllers/usuarios.controller");

const router = express.Router();

const idUsuarioParam = idParamSchema("El ID del usuario no es válido");

router.get("/", asyncHandler(usuariosController.listarActivos));

// Desbloqueo manual de cuentas bloqueadas por intentos fallidos (rol
// Administrador, mismo criterio que revocar accesos y eliminar documentos).
router.patch(
    "/:id/desbloquear",
    requerirRol(1),
    validar(idUsuarioParam, "params"),
    asyncHandler(usuariosController.desbloquear)
);

module.exports = router;
