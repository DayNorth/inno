// Rutas de autenticacion (capa delgada). Endpoints publicos (no requieren
// access token): login emite la sesion; refresh y logout dependen de la cookie
// httpOnly del refresh. En refresh y logout se aplica verificarOrigen (segunda
// capa CSRF, Decision 1) ademas de SameSite=Strict en la cookie. El rate
// limiting de estos endpoints se monta en app.js (patron de loginLimiter, F-04).
const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { validar } = require("../middleware/validar");
const verificarOrigen = require("../middleware/verificarOrigen");
const authController = require("../controllers/auth.controller");
const { loginSchema } = require("../validation/auth.schema");

const router = express.Router();

// Login: valida credenciales; setea cookie de refresh y devuelve access.
router.post("/login", validar(loginSchema), asyncHandler(authController.login));

// Refresh: rota el refresh de la cookie y devuelve un access nuevo.
router.post("/refresh", verificarOrigen, asyncHandler(authController.refresh));

// Logout: revoca la familia del refresh y borra la cookie.
router.post("/logout", verificarOrigen, asyncHandler(authController.logout));

module.exports = router;
