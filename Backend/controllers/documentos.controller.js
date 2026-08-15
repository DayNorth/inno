// Controlador de documentos. Quien sube o elimina sale SIEMPRE del token
// (req.usuario), nunca del body: el id_usuario de Documentos es trazabilidad de
// auditoría y un body no puede decidirlo.
const documentosService = require("../services/documentos.service");

async function listar(req, res) {
    const documentos = await documentosService.listar();
    res.status(200).json(documentos);
}

async function crear(req, res) {
    const idUsuario = req.usuario.id_usuario;
    const documento = await documentosService.crear(
        idUsuario,
        req.body,
        req.file
    );
    res.status(201).json({
        mensaje: "Documento subido correctamente",
        documento
    });
}

// Descarga autenticada: el archivo se sirve por esta ruta y no desde una URL
// estática, para que pase por verificarToken como cualquier otro dato.
// `attachment` + octet-stream: el navegador lo baja, nunca lo interpreta en el
// origen de la app (un HTML o SVG servido inline sería XSS almacenado).
async function descargar(req, res, next) {
    const { rutaAbsoluta, nombreArchivo } =
        await documentosService.obtenerParaDescarga(req.params.id);

    res.setHeader("Content-Type", "application/octet-stream");
    res.download(rutaAbsoluta, nombreArchivo, (error) => {
        if (error) {
            next(error);
        }
    });
}

async function eliminar(req, res) {
    const idUsuario = req.usuario.id_usuario;
    await documentosService.eliminar(idUsuario, req.params.id);
    res.status(200).json({
        mensaje: "Documento eliminado correctamente"
    });
}

module.exports = { listar, crear, descargar, eliminar };
