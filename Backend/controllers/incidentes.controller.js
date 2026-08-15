// Controlador de incidentes. Quien reporta/resuelve viene del token; el
// responsable del incidente es el id_usuario_responsable del body.
const incidentesService = require("../services/incidentes.service");

async function listar(req, res) {
    const incidentes = await incidentesService.listar();
    res.status(200).json(incidentes);
}

async function reportar(req, res) {
    const idUsuario = req.usuario.id_usuario;
    const incidente = await incidentesService.reportar(idUsuario, req.body);
    res.status(201).json({
        mensaje: "Incidente reportado correctamente",
        incidente
    });
}

async function resolver(req, res) {
    const idUsuario = req.usuario.id_usuario;
    await incidentesService.resolver(
        idUsuario,
        req.params.id,
        req.body.fecha_resolucion
    );
    res.status(200).json({
        mensaje: "Incidente resuelto correctamente"
    });
}

module.exports = { listar, reportar, resolver };
