const productosService = require("../services/productos.service");

async function listarActivos(req, res) {
    const productos = await productosService.listarActivos();
    res.status(200).json(productos);
}

async function listarTodos(req, res) {
    const productos = await productosService.listarTodos();
    res.status(200).json(productos);
}

async function obtenerPorId(req, res) {
    const producto = await productosService.obtenerPorId(req.params.id);
    res.status(200).json(producto);
}

async function crear(req, res) {
    const producto = await productosService.crear(req.body);
    res.status(201).json({
        mensaje: "Producto creado correctamente",
        producto
    });
}

async function actualizar(req, res) {
    const idUsuario = req.usuario.id_usuario;
    const producto = await productosService.actualizar(
        idUsuario,
        req.params.id,
        req.body
    );
    res.status(200).json({
        mensaje: "Producto actualizado correctamente",
        producto
    });
}

async function inactivar(req, res) {
    const idUsuario = req.usuario.id_usuario;
    await productosService.inactivar(idUsuario, req.params.id);
    res.status(200).json({
        mensaje: "Producto inactivado correctamente"
    });
}

async function reactivar(req, res) {
    const idUsuario = req.usuario.id_usuario;
    await productosService.reactivar(idUsuario, req.params.id);
    res.status(200).json({
        mensaje: "Producto reactivado correctamente"
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
