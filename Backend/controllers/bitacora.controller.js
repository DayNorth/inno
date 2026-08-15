const bitacoraService = require("../services/bitacora.service");

async function listar(req, res) {
    const registros = await bitacoraService.listar();
    res.status(200).json(registros);
}

module.exports = { listar };
