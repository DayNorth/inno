// Middleware de subida de un archivo (multer) para Documentos.
//
// Tres controles que se aplican ANTES de que el archivo exista entero en disco:
//   1. `limits.fileSize`: multer aborta el stream al pasarse; sin esto, subir
//      un archivo enorme es un DoS de disco gratis.
//   2. `limits.files: 1`: una sola parte de archivo por peticion.
//   3. `fileFilter`: allow-list de extension + MIME declarado.
// El cuarto control (firma real del contenido) NO cabe aqui -- necesita el
// archivo ya escrito -- y vive en el service.
//
// El nombre en disco lo genera el servidor (aleatorio). El nombre del cliente
// NUNCA se usa como ruta: solo se guarda saneado como etiqueta en BD.
const multer = require("multer");
const config = require("../config/env");
const {
    asegurarDirectorio,
    extensionDe,
    generarNombreEnDisco,
    tipoDeclaradoPermitido
} = require("../utils/archivos");

const DIR_UPLOADS = asegurarDirectorio();

// Nombre del campo multipart que lleva el archivo.
const CAMPO_ARCHIVO = "archivo";

const almacenamiento = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, DIR_UPLOADS);
    },
    filename(req, file, cb) {
        // Extension tomada de la allow-list, no del cliente tal cual: si
        // fileFilter dejo pasar el archivo, extensionDe ya es una de las
        // permitidas, asi que no puede colarse ".php" ni un nombre con rutas.
        cb(null, generarNombreEnDisco(extensionDe(file.originalname)));
    }
});

function fileFilter(req, file, cb) {
    if (!tipoDeclaradoPermitido(file.originalname, file.mimetype)) {
        // Se rechaza con un MulterError de codigo propio para que el handler
        // central lo mapee a 400 con el mensaje del catalogo, no a un 500.
        return cb(
            new multer.MulterError("LIMIT_UNEXPECTED_FILE", CAMPO_ARCHIVO)
        );
    }
    cb(null, true);
}

const subida = multer({
    storage: almacenamiento,
    fileFilter,
    limits: {
        fileSize: config.UPLOAD_MAX_BYTES,
        files: 1,
        // Los 3 ids del documento; sin tope, el multipart puede traer miles de
        // campos y consumir memoria antes de llegar a la validacion zod.
        fields: 10
    }
});

// Middleware listo para montar en la ruta: espera UN archivo en el campo
// "archivo" mas los campos de texto del formulario.
const subirDocumento = subida.single(CAMPO_ARCHIVO);

module.exports = { subirDocumento, CAMPO_ARCHIVO, DIR_UPLOADS };
