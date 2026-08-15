const riesgosService = require("../services/riesgos.service");

async function listar(req, res) {
    const riesgos = await riesgosService.listar();
    res.status(200).json(riesgos);
}

async function crear(req, res) {
    const idUsuario = req.usuario.id_usuario;
    const riesgo = await riesgosService.crear(idUsuario, req.body);
    res.status(201).json({
        mensaje: "Riesgo registrado correctamente",
        riesgo
    });
}

module.exports = { listar, crear };
