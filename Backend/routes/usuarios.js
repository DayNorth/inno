// Rutas de usuarios (capa delgada). GET /api/usuarios es auth-para-todos
// (ADR-001): alimenta selects de responsable, no expone contraseñas.
const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const usuariosController = require("../controllers/usuarios.controller");

const router = express.Router();

router.get("/", asyncHandler(usuariosController.listarActivos));

module.exports = router;
