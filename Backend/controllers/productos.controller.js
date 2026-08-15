const productosService = require("../services/productos.service");

async function listarActivos(req, res) {
    const productos = await productosService.listarActivos();
    res.status(200).json(productos);
}

async function crear(req, res) {
    const producto = await productosService.crear(req.body);
    res.status(201).json({
        mensaje: "Producto creado correctamente",
        producto
    });
}

module.exports = { listarActivos, crear };
