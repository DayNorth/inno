// Tests de utils/archivos: las reglas que hacen segura una subida. Cubren lo
// que un atacante intentaria primero — nombre con ruta ("../../.env"), tipo
// mentido en la extension/MIME, contenido que no coincide con lo declarado y
// ruta_archivo manipulada para salirse de la carpeta de subidas.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fsp = require("fs/promises");
const os = require("os");
const path = require("path");
const { fijarEnvDePrueba } = require("../helpers/env");

fijarEnvDePrueba();

// Directorio temporal ANTES de cargar el modulo: DIR_UPLOADS se resuelve al
// importar, asi que los tests no pueden escribir en Backend/uploads del proyecto.
const DIR_TEMP = path.join(os.tmpdir(), `vinkaplant-archivos-${process.pid}`);
process.env.UPLOAD_DIR = DIR_TEMP;

const archivos = require("../../utils/archivos");

before(async () => {
    await fsp.mkdir(DIR_TEMP, { recursive: true });
});

after(async () => {
    await fsp.rm(DIR_TEMP, { recursive: true, force: true });
});

async function escribirTemporal(nombre, contenido) {
    const ruta = path.join(DIR_TEMP, nombre);
    await fsp.writeFile(ruta, contenido);
    return ruta;
}

test("sanitizarNombreArchivo: descarta el componente de directorio (POSIX y Windows)", () => {
    assert.equal(
        archivos.sanitizarNombreArchivo("../../../etc/passwd"),
        "passwd"
    );
    assert.equal(
        archivos.sanitizarNombreArchivo("..\\..\\Backend\\.env"),
        ".env"
    );
    assert.equal(
        archivos.sanitizarNombreArchivo("C:\\Users\\x\\factura.pdf"),
        "factura.pdf"
    );
});

test("sanitizarNombreArchivo: quita bytes nulos y de control", () => {
    // "factura.pdf\u0000.exe" trunca la ruta en algunas APIs de sistema.
    assert.equal(
        archivos.sanitizarNombreArchivo("factura.pdf\u0000.exe"),
        "factura.pdf.exe"
    );
    assert.equal(
        archivos.sanitizarNombreArchivo("linea\u000drota.pdf"),
        "linearota.pdf"
    );
});

test("sanitizarNombreArchivo: navegacion pura o vacio -> nombre neutro", () => {
    assert.equal(archivos.sanitizarNombreArchivo(".."), "documento");
    assert.equal(archivos.sanitizarNombreArchivo("   "), "documento");
    assert.equal(archivos.sanitizarNombreArchivo(undefined), "documento");
});

test("sanitizarNombreArchivo: recorta al maximo de la columna varchar(255)", () => {
    const largo = "a".repeat(400) + ".pdf";
    assert.equal(archivos.sanitizarNombreArchivo(largo).length, 255);
});

test("generarNombreEnDisco: aleatorio, no reutiliza el nombre del cliente", () => {
    const a = archivos.generarNombreEnDisco(".pdf");
    const b = archivos.generarNombreEnDisco(".pdf");
    assert.match(a, /^[0-9a-f]{32}\.pdf$/);
    assert.notEqual(a, b);
});

test("tipoDeclaradoPermitido: acepta la allow-list y rechaza el resto", () => {
    assert.equal(
        archivos.tipoDeclaradoPermitido("f.pdf", "application/pdf"),
        true
    );
    assert.equal(archivos.tipoDeclaradoPermitido("f.PNG", "image/png"), true);
    // Ejecutables, scripts y todo lo interpretable por el navegador quedan fuera.
    assert.equal(
        archivos.tipoDeclaradoPermitido("f.exe", "application/octet-stream"),
        false
    );
    assert.equal(archivos.tipoDeclaradoPermitido("f.html", "text/html"), false);
    assert.equal(
        archivos.tipoDeclaradoPermitido("f.svg", "image/svg+xml"),
        false
    );
    assert.equal(archivos.tipoDeclaradoPermitido("f", "application/pdf"), false);
});

test("tipoDeclaradoPermitido: extension permitida con MIME que no le toca -> false", () => {
    // Extension de la allow-list pero MIME de otra cosa: incoherente, se rechaza.
    assert.equal(archivos.tipoDeclaradoPermitido("f.pdf", "text/html"), false);
});

test("verificarFirma: acepta el contenido que coincide con la extension", async () => {
    const pdf = await escribirTemporal(
        "ok.pdf",
        Buffer.from("%PDF-1.7\nresto")
    );
    const png = await escribirTemporal(
        "ok.png",
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])
    );
    const jpg = await escribirTemporal(
        "ok.jpg",
        Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00])
    );

    assert.equal(await archivos.verificarFirma(pdf, ".pdf"), true);
    assert.equal(await archivos.verificarFirma(png, ".png"), true);
    assert.equal(await archivos.verificarFirma(jpg, ".jpg"), true);
});

test("verificarFirma: rechaza un ejecutable renombrado a .pdf", async () => {
    // "MZ" es la cabecera de un .exe de Windows. Extension y MIME dirian PDF;
    // el contenido no. Este es el control que no se puede falsificar desde el
    // cliente, porque mira el binario ya escrito.
    const falso = await escribirTemporal(
        "malo.pdf",
        Buffer.from([0x4d, 0x5a, 0x90, 0x00])
    );
    assert.equal(await archivos.verificarFirma(falso, ".pdf"), false);
});

test("verificarFirma: archivo mas corto que la firma -> false, sin reventar", async () => {
    const corto = await escribirTemporal("corto.png", Buffer.from([0x89]));
    assert.equal(await archivos.verificarFirma(corto, ".png"), false);
});

test("verificarFirma: extension fuera de la allow-list -> false", async () => {
    const ruta = await escribirTemporal("x.txt", Buffer.from("%PDF-1.7"));
    assert.equal(await archivos.verificarFirma(ruta, ".txt"), false);
});

test("rutaSeguraEnUploads: resuelve dentro de la carpeta de subidas", () => {
    const ruta = archivos.rutaSeguraEnUploads("abc123.pdf");
    assert.equal(ruta, path.resolve(DIR_TEMP, "abc123.pdf"));
});

test("rutaSeguraEnUploads: no deja escapar de la carpeta", () => {
    // Aunque llegara una ruta manipulada desde BD, se queda en el ultimo
    // segmento y jamas apunta fuera de uploads.
    assert.equal(
        archivos.rutaSeguraEnUploads("../../.env"),
        path.resolve(DIR_TEMP, ".env")
    );
    assert.equal(
        archivos.rutaSeguraEnUploads("/etc/passwd"),
        path.resolve(DIR_TEMP, "passwd")
    );
    assert.equal(archivos.rutaSeguraEnUploads(""), null);
    assert.equal(archivos.rutaSeguraEnUploads(null), null);
});

test("borrarSilencioso: borra si existe y no lanza si no existe", async () => {
    const ruta = await escribirTemporal("borrame.pdf", Buffer.from("%PDF-"));
    assert.equal(await archivos.borrarSilencioso(ruta), true);
    assert.equal(await archivos.borrarSilencioso(ruta), false);
    assert.equal(await archivos.borrarSilencioso(null), false);
});
