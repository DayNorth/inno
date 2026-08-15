// Controlador de accesos. Quien registra/revisa/revoca viene del token; el
// id_usuario del body es el titular del acceso.
const accesosService = require("../services/accesos.service");

async function listar(req, res) {
    const accesos = await accesosService.listar();
    res.status(200).json(accesos);
}

async function crear(req, res) {
    const idUsuarioRegistra = req.usuario.id_usuario;
    const acceso = await accesosService.crear(idUsuarioRegistra, req.body);
    res.status(201).json({
        mensaje: "Acceso registrado correctamente",
        acceso
    });
}

async function revisar(req, res) {
    const idUsuarioRegistra = req.usuario.id_usuario;
    await accesosService.revisar(idUsuarioRegistra, req.params.id);
    res.status(200).json({
        mensaje: "Acceso marcado como revisado"
    });
}

async function revocar(req, res) {
    const idUsuarioRegistra = req.usuario.id_usuario;
    await accesosService.revocar(idUsuarioRegistra, req.params.id);
    res.status(200).json({
        mensaje: "Acceso revocado correctamente"
    });
}

module.exports = { listar, crear, revisar, revocar };
