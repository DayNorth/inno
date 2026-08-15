// Utilidades de archivos subidos (Documentos). Concentra las reglas que hacen
// que una subida sea segura, para que no queden dispersas entre multer, el
// service y el controller:
//   - allow-list de tipos (extension + MIME declarado + FIRMA real del binario),
//   - saneado del nombre que manda el cliente (nunca toca el disco),
//   - contencion de rutas dentro de la carpeta de subidas,
//   - borrado tolerante a fallos para no dejar archivos huerfanos.
//
// Regla de fondo: TODO lo que viene del cliente (nombre, extension, MIME) es
// dato sospechoso. El nombre en disco lo genera el servidor; el del cliente
// solo se guarda como etiqueta para mostrar y descargar.
const crypto = require("crypto");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const config = require("../config/env");

// Carpeta real de subidas. UPLOAD_DIR relativo se resuelve contra Backend/.
const DIR_UPLOADS = path.isAbsolute(config.UPLOAD_DIR)
    ? config.UPLOAD_DIR
    : path.resolve(__dirname, "..", config.UPLOAD_DIR);

// Allow-list cerrada: extension -> MIME aceptado + firmas (magic numbers) que
// debe tener el contenido real. Es allow-list y no deny-list a proposito: una
// lista de "extensiones prohibidas" siempre deja fuera algo (.phtml, .svgz...).
// Nada ejecutable ni interpretable por el navegador (sin .html, .svg, .js).
const TIPOS_PERMITIDOS = Object.freeze({
    ".pdf": {
        mimes: ["application/pdf"],
        firmas: [Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d])] // %PDF-
    },
    ".png": {
        mimes: ["image/png"],
        firmas: [
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
        ]
    },
    ".jpg": {
        mimes: ["image/jpeg"],
        firmas: [Buffer.from([0xff, 0xd8, 0xff])]
    },
    ".jpeg": {
        mimes: ["image/jpeg"],
        firmas: [Buffer.from([0xff, 0xd8, 0xff])]
    }
});

// Longitud maxima que hay que leer para decidir cualquiera de las firmas.
const BYTES_FIRMA = 8;

const MENSAJE_TIPO_NO_PERMITIDO =
    "Solo se permiten archivos PDF, PNG o JPG";

// Extension en minuscula, incluido el punto ("" si no tiene).
function extensionDe(nombre) {
    return path.extname(String(nombre || "")).toLowerCase();
}

// Saneado del nombre del cliente para GUARDARLO COMO ETIQUETA (nunca como ruta
// en disco). Quita cualquier componente de directorio -- "../../.env" y
// "C:\\ruta\\x.pdf" colapsan a su ultimo segmento -- mas bytes nulos y de
// control, que en algunos sistemas truncan la ruta o ensucian las cabeceras.
function sanitizarNombreArchivo(nombre) {
    const crudo = String(nombre || "");
    // Separadores de AMBOS sistemas: path.basename de POSIX no corta por "\".
    const ultimoSegmento = crudo.split(/[/\\]/).pop() || "";

    // eslint-disable-next-line no-control-regex
    const limpio = ultimoSegmento.replace(/[\u0000-\u001f\u007f]/g, "").trim();

    // ".." o "." como nombre completo no son nombres, son navegacion.
    if (limpio === "" || limpio === "." || limpio === "..") {
        return "documento";
    }

    return limpio.slice(0, 255);
}

// Nombre con el que el archivo vive en disco: aleatorio, sin relacion con lo
// que mando el cliente. Evita colisiones, sobrescrituras y adivinar URLs.
function generarNombreEnDisco(extension) {
    return crypto.randomBytes(16).toString("hex") + extension;
}

// Verifica extension + MIME declarado contra la allow-list. NO mira el
// contenido: eso es verificarFirma, que corre despues de escribir el archivo.
function tipoDeclaradoPermitido(nombreOriginal, mimeDeclarado) {
    const extension = extensionDe(nombreOriginal);
    const permitido = TIPOS_PERMITIDOS[extension];

    if (!permitido) {
        return false;
    }

    return permitido.mimes.includes(String(mimeDeclarado || "").toLowerCase());
}

// Comprueba que el CONTENIDO real empiece por la firma del tipo declarado. El
// MIME y la extension los elige el cliente: sin este paso, un .pdf de nombre
// puede traer cualquier cosa dentro. Lee solo la cabecera, no el archivo entero.
async function verificarFirma(rutaAbsoluta, extension) {
    const permitido = TIPOS_PERMITIDOS[extension];

    if (!permitido) {
        return false;
    }

    let manejador;
    try {
        manejador = await fsp.open(rutaAbsoluta, "r");
        const buffer = Buffer.alloc(BYTES_FIRMA);
        const { bytesRead } = await manejador.read(buffer, 0, BYTES_FIRMA, 0);
        const cabecera = buffer.subarray(0, bytesRead);

        return permitido.firmas.some(
            (firma) =>
                cabecera.length >= firma.length &&
                cabecera.subarray(0, firma.length).equals(firma)
        );
    } finally {
        if (manejador) {
            await manejador.close();
        }
    }
}

// Resuelve una ruta guardada en BD contra la carpeta de subidas y comprueba que
// NO se escape de ella. Defensa en profundidad: hoy ruta_archivo la genera el
// servidor, pero si alguna vez entra un valor manipulado ("../../.env"), aqui
// muere en vez de servir un archivo arbitrario del disco.
function rutaSeguraEnUploads(rutaGuardada) {
    if (!rutaGuardada) {
        return null;
    }

    // Solo el ultimo segmento: el nombre en disco nunca lleva subcarpetas.
    const nombre = String(rutaGuardada).split(/[/\\]/).pop() || "";
    const resuelta = path.resolve(DIR_UPLOADS, nombre);
    const base = path.resolve(DIR_UPLOADS) + path.sep;

    return resuelta.startsWith(base) ? resuelta : null;
}

// Crea la carpeta de subidas si no existe (sincrono: corre una vez al cargar
// el middleware de subida, antes de atender peticiones).
function asegurarDirectorio() {
    fs.mkdirSync(DIR_UPLOADS, { recursive: true });
    return DIR_UPLOADS;
}

// Borra sin lanzar: se usa para limpiar huerfanos, donde un fallo al borrar no
// debe convertirse en el error que ve el cliente. Devuelve true si borro.
async function borrarSilencioso(rutaAbsoluta) {
    if (!rutaAbsoluta) {
        return false;
    }

    try {
        await fsp.unlink(rutaAbsoluta);
        return true;
    } catch (_error) {
        return false;
    }
}

module.exports = {
    DIR_UPLOADS,
    TIPOS_PERMITIDOS,
    MENSAJE_TIPO_NO_PERMITIDO,
    extensionDe,
    sanitizarNombreArchivo,
    generarNombreEnDisco,
    tipoDeclaradoPermitido,
    verificarFirma,
    rutaSeguraEnUploads,
    asegurarDirectorio,
    borrarSilencioso
};
