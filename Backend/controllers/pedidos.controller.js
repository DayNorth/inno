// Controlador de pedidos. La identidad (idUsuario) viene del token, nunca del
// body; el id_cliente sí viene del body validado.
const pedidosService = require("../services/pedidos.service");

async function listar(req, res) {
    const pedidos = await pedidosService.listar();
    res.status(200).json(pedidos);
}

async function obtener(req, res) {
    const pedido = await pedidosService.obtenerConDetalles(req.params.id);
    res.status(200).json(pedido);
}

async function crear(req, res) {
    const idUsuario = req.usuario.id_usuario;
    const idPedido = await pedidosService.crear(idUsuario, req.body);
    res.status(201).json({
        mensaje: "Pedido creado correctamente",
        id_pedido: idPedido
    });
}

async function actualizar(req, res) {
    const idUsuario = req.usuario.id_usuario;
    const pedido = await pedidosService.actualizar(
        idUsuario,
        req.params.id,
        req.body
    );
    res.status(200).json({
        mensaje: "Pedido actualizado correctamente",
        pedido
    });
}

async function cambiarEstado(req, res) {
    const idUsuario = req.usuario.id_usuario;
    const pedido = await pedidosService.cambiarEstado(
        idUsuario,
        req.params.id,
        req.body.estado
    );
    res.status(200).json({
        mensaje: "Estado del pedido actualizado correctamente",
        pedido
    });
}

async function cancelar(req, res) {
    const idUsuario = req.usuario.id_usuario;
    await pedidosService.cancelar(idUsuario, req.params.id);
    res.status(200).json({
        mensaje: "Pedido cancelado correctamente"
    });
}

module.exports = {
    listar,
    obtener,
    crear,
    actualizar,
    cambiarEstado,
    cancelar
};
