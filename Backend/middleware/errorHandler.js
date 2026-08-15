// Error handler central (4 argumentos). Único punto de mapeo de errores a
// respuestas HTTP. Reglas duras (F-05):
//  - NUNCA se envía al cliente error.message/stack/SQL/error.number ni
//    nombres de constraint para errores NO operacionales: solo un mensaje
//    genérico en español + el header x-request-id.
//  - El detalle (stack, número SQL, correlationId) va SOLO al log.
//  - ZodError se mapea a 400 con un mensaje derivado, sin exponer issues.
//  - El 401 de auth es neutro (no distingue inexistente/revocado/expirado).
const { ZodError } = require("zod");
const { AppError } = require("../errors/AppError");
const { mensajeDesde } = require("./validar");
const { borrarSilencioso, MENSAJE_TIPO_NO_PERMITIDO } = require("../utils/archivos");

// El logger se obtiene de req.log (pino-http) si existe; si no, del base.
function obtenerLogger(req) {
    return req.log || require("../logger");
}

// Mensajes de los fallos de multer. LIMIT_UNEXPECTED_FILE es doble: multer lo
// emite para un campo de archivo inesperado y es tambien el codigo con el que
// el fileFilter rechaza un tipo fuera de la allow-list; ambos casos son "ese
// archivo no", asi que comparten mensaje.
const MENSAJES_MULTER = {
    LIMIT_FILE_SIZE: "El archivo supera el tamaño máximo permitido",
    LIMIT_FILE_COUNT: "Solo se puede subir un archivo por documento",
    LIMIT_UNEXPECTED_FILE: MENSAJE_TIPO_NO_PERMITIDO,
    LIMIT_FIELD_COUNT: "El formulario tiene demasiados campos"
};

// eslint-disable-next-line no-unused-vars
function errorHandler(error, req, res, next) {
    const logger = obtenerLogger(req);

    // Si la peticion que falla habia subido un archivo, multer ya lo escribio
    // en disco antes de que corriera la validacion o el service. Como la
    // respuesta va a ser un error, la fila nunca se creo: el archivo quedaria
    // huerfano y sin nada que lo referencie. Se borra aqui, en el unico punto
    // por el que pasan TODOS los fallos (zod, FK, 500 del driver...).
    if (req.file && req.file.path) {
        borrarSilencioso(req.file.path).then((borrado) => {
            if (!borrado) {
                logger.warn(
                    { archivo: req.file.filename },
                    "No se pudo borrar el archivo huérfano de una subida fallida"
                );
            }
        });
    }

    // 1) Errores operacionales de dominio (AppError): mensaje seguro tal cual.
    if (error instanceof AppError) {
        logger.warn(
            { codigo: error.codigo, status: error.status },
            error.message
        );
        return res.status(error.status).json({ mensaje: error.message });
    }

    // 2) ZodError que no pasó por el middleware (defensa): 400 con un mensaje
    //    derivado; nunca el array de issues crudo.
    if (error instanceof ZodError) {
        const mensaje = mensajeDesde(error.issues[0]);
        logger.warn({ codigo: "VALIDACION" }, mensaje);
        return res.status(400).json({ mensaje });
    }

    // 3) Errores JWT (por si alguno escapa del middleware auth): 401 neutro.
    if (
        error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError"
    ) {
        logger.warn({ codigo: "TOKEN" }, "Token inválido o expirado");
        return res
            .status(401)
            .json({ mensaje: "Token inválido o expirado" });
    }

    // 4) Fallos de multer (tamaño, cantidad, tipo fuera de la allow-list): son
    //    errores del cliente, no del servidor -> 400 con mensaje del catálogo.
    //    Se detecta por `name` igual que los de JWT, sin importar multer aquí.
    if (error.name === "MulterError") {
        const mensaje =
            MENSAJES_MULTER[error.code] || "No se pudo procesar el archivo";
        logger.warn({ codigo: "SUBIDA", multer: error.code }, mensaje);
        return res.status(400).json({ mensaje });
    }

    // 5) Violación de FK (SQL Server 547) no traducida en el service: 409
    //    con mensaje neutro. El detalle (número, constraint) solo al log.
    if (error.number === 547) {
        logger.warn({ codigo: "FK" }, "Violación de clave foránea (547)");
        return res.status(409).json({
            mensaje: "La operación referencia un registro que no existe"
        });
    }

    // 6) Cualquier otro error: NO operacional -> 500 genérico. Se loguea el
    //    error completo (stack incluido) para diagnóstico; al cliente solo el
    //    mensaje neutro. Nunca se filtra el detalle interno.
    logger.error({ err: error }, "Error no controlado");
    return res.status(500).json({
        mensaje: "Ocurrió un error interno en el servidor"
    });
}

module.exports = errorHandler;
