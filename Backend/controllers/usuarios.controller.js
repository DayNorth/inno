// Controlador de usuarios: mapea la lista al array crudo, status 200.
const usuariosService = require("../services/usuarios.service");

async function listarActivos(req, res) {
    const usuarios = await usuariosService.listarActivos();
    res.status(200).json(usuarios);
}

module.exports = { listarActivos };
