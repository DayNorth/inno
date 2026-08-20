// Controlador de permisos. Solo Administrador puede asignar/revocar (rol
// aplicado en la ruta); consultar el catálogo y la matriz está disponible
// para cualquier usuario autenticado, igual que /api/usuarios.
const permisosService = require("../services/permisos.service");

async function listarPermisos(req, res) {
    const permisos = await permisosService.listarPermisos();
    res.status(200).json(permisos);
}

async function listarMatriz(req, res) {
    const matriz = await permisosService.listarMatriz();
    res.status(200).json(matriz);
}

async function listarPermisosDeRol(req, res) {
    const permisos = await permisosService.listarPermisosDeRol(
        req.params.id
    );
    res.status(200).json(permisos);
}

async function asignar(req, res) {
    const idUsuario = req.usuario.id_usuario;
    const asignacion = await permisosService.asignar(
        idUsuario,
        req.params.id,
        req.body.id_permiso
    );
    res.status(201).json({
        mensaje: "Permiso asignado correctamente",
        asignacion
    });
}

async function revocar(req, res) {
    const idUsuario = req.usuario.id_usuario;
    await permisosService.revocar(
        idUsuario,
        req.params.id,
        req.params.idPermiso
    );
    res.status(200).json({
        mensaje: "Permiso revocado correctamente"
    });
}

module.exports = {
    listarPermisos,
    listarMatriz,
    listarPermisosDeRol,
    asignar,
    revocar
};
