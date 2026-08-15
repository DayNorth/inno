// Servicio de documentos: DUEÑO de la transacción. Sube (verificación de firma
// + insert + Bitacora), sirve la descarga y elimina (delete + Bitacora + borrado
// del archivo). Traduce la FK 547 al mensaje del contexto.
//
// Orden deliberado en `crear`: el archivo ya está en disco cuando entra aquí
// (multer escribe antes que corra el controller), así que lo primero es
// comprobar que su CONTENIDO es lo que dice ser. Si no lo es, se lanza antes de
// tocar la BD y el handler central borra el huérfano.
const fsp = require("fs/promises");
const { poolPromise } = require("../db");
const logger = require("../logger");
const { conTransaccion } = require("../utils/transacciones");
const {
    ErrorConflicto,
    ErrorNoEncontrado,
    ErrorValidacion
} = require("../errors/AppError");
const { esViolacionFk } = require("../utils/erroresSql");
const {
    MENSAJE_TIPO_NO_PERMITIDO,
    extensionDe,
    sanitizarNombreArchivo,
    verificarFirma,
    rutaSeguraEnUploads,
    borrarSilencioso
} = require("../utils/archivos");
const documentosRepo = require("../repositories/documentos.repository");
const bitacoraRepo = require("../repositories/bitacora.repository");

async function listar() {
    const pool = await poolPromise;
    return documentosRepo.listar(pool);
}

// Sube un documento. `archivo` es el objeto de multer (ya en disco).
async function crear(idUsuario, datos, archivo) {
    if (!archivo) {
        throw new ErrorValidacion("Debe adjuntar un archivo");
    }

    // Cuarto y último control de la subida: la FIRMA real del binario. La
    // extensión y el MIME los eligió el cliente y multer solo pudo creerles;
    // esto es lo que impide que un ejecutable viaje disfrazado de .pdf.
    const extension = extensionDe(archivo.originalname);
    const firmaValida = await verificarFirma(archivo.path, extension);

    if (!firmaValida) {
        throw new ErrorValidacion(MENSAJE_TIPO_NO_PERMITIDO);
    }

    const nombreArchivo = sanitizarNombreArchivo(archivo.originalname);
    const pool = await poolPromise;

    try {
        return await conTransaccion(pool, async (transaction) => {
            const documento = await documentosRepo.insertar(transaction, {
                id_pedido: datos.id_pedido,
                id_tipo: datos.id_tipo,
                id_plataforma: datos.id_plataforma,
                nombre_archivo: nombreArchivo,
                // Solo el nombre generado: la carpeta la resuelve el servidor.
                ruta_archivo: archivo.filename,
                id_usuario: idUsuario
            });

            await bitacoraRepo.registrar(
                transaction,
                idUsuario,
                `Subió el documento ID ${documento.id_documento} al pedido ${datos.id_pedido}`
            );

            return documento;
        });
    } catch (error) {
        if (esViolacionFk(error)) {
            throw new ErrorConflicto(
                "El pedido, el tipo de documento o la plataforma indicada no existe"
            );
        }
        throw error;
    }
}

// Datos para servir la descarga: ruta ya validada dentro de uploads y nombre
// visible. 404 tanto si la fila no existe como si el archivo no está en disco:
// para el cliente son el mismo "ese documento no se puede descargar".
async function obtenerParaDescarga(idDocumento) {
    const pool = await poolPromise;
    const fila = await documentosRepo.obtenerParaDescarga(pool, idDocumento);

    if (!fila) {
        throw new ErrorNoEncontrado("Documento no encontrado");
    }

    const rutaAbsoluta = rutaSeguraEnUploads(fila.ruta_archivo);

    if (!rutaAbsoluta) {
        // Ruta vacía o que intenta salirse de uploads: no se sirve nada. Se
        // registra porque, con las rutas generadas por el servidor, esto no
        // debería poder pasar.
        logger.warn(
            { id_documento: fila.id_documento },
            "Documento con ruta de archivo inválida"
        );
        throw new ErrorNoEncontrado("El archivo del documento no está disponible");
    }

    try {
        await fsp.access(rutaAbsoluta);
    } catch (_error) {
        throw new ErrorNoEncontrado("El archivo del documento no está disponible");
    }

    return { rutaAbsoluta, nombreArchivo: fila.nombre_archivo };
}

async function eliminar(idUsuario, idDocumento) {
    const pool = await poolPromise;

    const documento = await conTransaccion(pool, async (transaction) => {
        const eliminado = await documentosRepo.eliminar(
            transaction,
            idDocumento
        );

        if (!eliminado) {
            throw new ErrorNoEncontrado("Documento no encontrado");
        }

        await bitacoraRepo.registrar(
            transaction,
            idUsuario,
            `Eliminó el documento ID ${idDocumento}`
        );

        return eliminado;
    });

    // Después del commit: borrar un archivo no se revierte con un rollback, así
    // que primero se confirma la baja en BD. Si el unlink falla, la operación
    // NO se deshace (la fila ya no está); queda un archivo suelto y un warn.
    const rutaAbsoluta = rutaSeguraEnUploads(documento.ruta_archivo);

    if (rutaAbsoluta) {
        const borrado = await borrarSilencioso(rutaAbsoluta);

        if (!borrado) {
            logger.warn(
                { id_documento: documento.id_documento },
                "Fila de documento eliminada pero el archivo sigue en disco"
            );
        }
    }

    return documento;
}

module.exports = { listar, crear, obtenerParaDescarga, eliminar };
