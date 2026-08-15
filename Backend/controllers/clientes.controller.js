// Controlador de clientes: orquesta HTTP. Lee req (params/body ya validados por
// zod, e identidad de req.usuario -del token-), llama al service y mapea el
// retorno a res con el status y el sobre { mensaje } EXACTOS del contrato
// legacy. No contiene lógica de dominio ni toca SQL. Los errores se propagan
// al error handler central vía asyncHandler (sin try/catch).
const clientesService = require("../services/clientes.service");

async function listarActivos(req, res) {
    const clientes = await clientesService.listarActivos();
    res.status(200).json(clientes);
}

async function listarTodos(req, res) {
    const clientes = await clientesService.listarTodos();
    res.status(200).json(clientes);
}

async function obtenerPorId(req, res) {
    const cliente = await clientesService.obtenerPorId(req.params.id);
    res.status(200).json(cliente);
}

async function crear(req, res) {
    // Identidad tomada del token verificado, nunca del body.
    const idUsuario = req.usuario.id_usuario;
    const cliente = await clientesService.crear(idUsuario, req.body);

    res.status(201).json({
        mensaje: "Cliente creado correctamente",
        cliente
    });
}

async function actualizar(req, res) {
    const idUsuario = req.usuario.id_usuario;
    const cliente = await clientesService.actualizar(
        idUsuario,
        req.params.id,
        req.body
    );

    res.status(200).json({
        mensaje: "Cliente actualizado correctamente",
        cliente
    });
}

async function inactivar(req, res) {
    const idUsuario = req.usuario.id_usuario;
    await clientesService.inactivar(idUsuario, req.params.id);

    res.status(200).json({
        mensaje: "Cliente inactivado correctamente"
    });
}

async function reactivar(req, res) {
    const idUsuario = req.usuario.id_usuario;
    await clientesService.reactivar(idUsuario, req.params.id);

    res.status(200).json({
        mensaje: "Cliente reactivado correctamente"
    });
}

module.exports = {
    listarActivos,
    listarTodos,
    obtenerPorId,
    crear,
    actualizar,
    inactivar,
    reactivar
};
