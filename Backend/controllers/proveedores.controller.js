// Controlador de proveedores: orquesta HTTP. Lee req (params/body ya validados
// por zod, e identidad de req.usuario -del token, nunca del body-), llama al
// service y mapea el retorno a res con el status y el sobre { mensaje } EXACTOS
// del contrato legacy. Sin lógica de dominio ni SQL. Los errores se propagan al
// error handler central vía asyncHandler (sin try/catch).
const proveedoresService = require("../services/proveedores.service");

async function listar(req, res) {
    const proveedores = await proveedoresService.listar();
    res.status(200).json(proveedores);
}

async function obtener(req, res) {
    const proveedor = await proveedoresService.obtenerDetalle(req.params.id);
    res.status(200).json(proveedor);
}

async function crear(req, res) {
    const idUsuario = req.usuario.id_usuario;
    const proveedor = await proveedoresService.crear(idUsuario, req.body);

    res.status(201).json({
        mensaje: "Proveedor evaluado correctamente",
        proveedor
    });
}

async function registrarEvaluacion(req, res) {
    const idUsuario = req.usuario.id_usuario;
    const evaluacion = await proveedoresService.registrarEvaluacion(
        idUsuario,
        req.params.id,
        req.body
    );

    res.status(201).json({
        mensaje: "Evaluación registrada correctamente",
        evaluacion
    });
}

async function registrarPlan(req, res) {
    const idUsuario = req.usuario.id_usuario;
    const plan = await proveedoresService.registrarPlan(
        idUsuario,
        req.params.id,
        req.body
    );

    res.status(201).json({
        mensaje: "Plan de contingencia registrado correctamente",
        plan
    });
}

module.exports = {
    listar,
    obtener,
    crear,
    registrarEvaluacion,
    registrarPlan
};
