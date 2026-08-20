// Rutas de permisos (capa delgada). Lectura: cualquier autenticado (igual que
// /api/usuarios, alimenta pantallas administrativas). Asignar/revocar: solo
// Administrador (rol 1), igual criterio que revocar accesos y eliminar
// documentos.
const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { validar } = require("../middleware/validar");
const { requerirRol } = require("../middleware/auth");
const permisosController = require("../controllers/permisos.controller");
const {
    idRolParam,
    asignarPermisoSchema,
    idRolYPermisoParam
} = require("../validation/permisos.schema");

const router = express.Router();

// Catálogo completo de permisos.
router.get("/", asyncHandler(permisosController.listarPermisos));

// Matriz completa Rol -> Permisos (para pintar la tabla de administración).
router.get("/matriz", asyncHandler(permisosController.listarMatriz));

// Permisos asignados a un rol puntual.
router.get(
    "/roles/:id",
    validar(idRolParam, "params"),
    asyncHandler(permisosController.listarPermisosDeRol)
);

// Asignar un permiso a un rol.
router.post(
    "/roles/:id",
    requerirRol(1),
    validar(idRolParam, "params"),
    validar(asignarPermisoSchema),
    asyncHandler(permisosController.asignar)
);

// Revocar un permiso de un rol.
router.delete(
    "/roles/:id/:idPermiso",
    requerirRol(1),
    validar(idRolYPermisoParam, "params"),
    asyncHandler(permisosController.revocar)
);

module.exports = router;
