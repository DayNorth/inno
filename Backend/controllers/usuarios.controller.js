// Controlador de usuarios: mapea la lista al array crudo, status 200.
const usuariosService = require("../services/usuarios.service");

async function listarActivos(req, res) {
    const usuarios = await usuariosService.listarActivos();
    res.status(200).json(usuarios);
}

async function desbloquear(req, res) {
    const idUsuarioAdmin = req.usuario.id_usuario;
    const usuario = await usuariosService.desbloquear(
        idUsuarioAdmin,
        req.params.id
    );
    res.status(200).json({
        mensaje: "Usuario desbloqueado correctamente",
        usuario
    });
}

module.exports = { listarActivos, desbloquear };
