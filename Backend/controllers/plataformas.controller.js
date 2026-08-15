const plataformasService = require("../services/plataformas.service");

async function listar(req, res) {
    const plataformas = await plataformasService.listar();
    res.status(200).json(plataformas);
}

module.exports = { listar };
