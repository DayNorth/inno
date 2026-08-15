// Controlador de dispositivos. La identidad de quien registra viene del token
// (req.usuario), nunca del body; el id_usuario del body es el RESPONSABLE.
const dispositivosService = require("../services/dispositivos.service");

async function listar(req, res) {
    const dispositivos = await dispositivosService.listar();
    res.status(200).json(dispositivos);
}

async function crear(req, res) {
    const idUsuarioRegistra = req.usuario.id_usuario;
    const dispositivo = await dispositivosService.crear(
        idUsuarioRegistra,
        req.body
    );
    res.status(201).json({
        mensaje: "Dispositivo registrado correctamente",
        dispositivo
    });
}

module.exports = { listar, crear };
