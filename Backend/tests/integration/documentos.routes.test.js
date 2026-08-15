// Tests de integracion de las rutas de documentos con supertest. El service se
// mockea (no se toca SQL), pero TODO lo demas es real: verificarToken con un JWT
// firmado, requerirRol, multer escribiendo en disco, zod y el error handler
// central. Es la unica capa donde se puede comprobar el ORDEN del pipeline y la
// limpieza de archivos huerfanos, que ningun test unitario ve.
const { test, before, beforeEach, afterEach, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const fsp = require("fs/promises");
const os = require("os");
const path = require("path");
const { fijarEnvDePrueba } = require("../helpers/env");
const {
    mockModule,
    limpiarCache,
    crearLoggerSilencioso
} = require("../helpers/mockModule");
const { ErrorNoEncontrado } = require("../../errors/AppError");

fijarEnvDePrueba();

// Carpeta de subidas temporal y tope de tamano pequeno: se fijan ANTES de que
// se cargue config/env (lo hace app), para no escribir en Backend/uploads ni
// tener que mover megabytes en el test del limite.
const DIR_TEMP = path.join(os.tmpdir(), `vinkaplant-docs-${process.pid}`);
process.env.UPLOAD_DIR = DIR_TEMP;
process.env.UPLOAD_MAX_BYTES = "1024";

const jwt = require("jsonwebtoken");
const request = require("supertest");

const PDF = Buffer.from("%PDF-1.7\ncontenido de prueba");
const EJECUTABLE = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03]);

function bearer(token) {
    return "Bearer " + token;
}

function token(id_rol, id_usuario = 42) {
    return jwt.sign(
        { id_usuario, correo: "u@x.co", id_rol, rol: "R" },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
    );
}

const cadena = [
    "../../services/documentos.service",
    "../../controllers/documentos.controller",
    "../../routes/documentos",
    "../../middleware/subirArchivo",
    "../../app"
];

let servicioMock;
let app;

function cargarApp() {
    limpiarCache(...cadena);
    mockModule("../../services/documentos.service", servicioMock);
    return require(path.resolve(__dirname, "../../app"));
}

// Archivos que hay ahora mismo en la carpeta de subidas.
function archivosEnDisco() {
    return fs.existsSync(DIR_TEMP) ? fs.readdirSync(DIR_TEMP) : [];
}

// Espera activa corta: el borrado del huerfano lo lanza el error handler sin
// await (no debe retrasar la respuesta), asi que al llegar el 400 puede seguir
// en vuelo.
async function esperarHasta(condicion, ms = 1000) {
    const limite = Date.now() + ms;
    while (Date.now() < limite) {
        if (condicion()) return true;
        await new Promise((r) => setTimeout(r, 10));
    }
    return condicion();
}

before(() => {
    mockModule("../../db", { poolPromise: Promise.resolve({}), sql: {} });
    mockModule("../../logger", crearLoggerSilencioso());
    fs.mkdirSync(DIR_TEMP, { recursive: true });
});

after(async () => {
    await fsp.rm(DIR_TEMP, { recursive: true, force: true });
});

beforeEach(() => {
    servicioMock = {
        listar: async () => [{ id_documento: 1, nombre_archivo: "f.pdf" }],
        crear: async () => ({ id_documento: 99, nombre_archivo: "f.pdf" }),
        obtenerParaDescarga: async () => ({
            rutaAbsoluta: path.join(DIR_TEMP, "descargable.pdf"),
            nombreArchivo: "factura marzo.pdf"
        }),
        eliminar: async () => ({ id_documento: 5 })
    };
    app = cargarApp();
});

afterEach(async () => {
    for (const nombre of archivosEnDisco()) {
        await fsp.rm(path.join(DIR_TEMP, nombre), { force: true });
    }
});

test("GET /api/documentos sin token responde 401", async () => {
    const res = await request(app).get("/api/documentos");
    assert.equal(res.status, 401);
    assert.equal(res.body.mensaje, "Token no proporcionado");
});

test("GET /api/documentos con token responde 200 y array", async () => {
    const res = await request(app)
        .get("/api/documentos")
        .set("Authorization", bearer(token(3)));

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
});

test("POST /api/documentos sube un PDF y responde 201 con sobre exacto", async () => {
    let recibido;
    servicioMock.crear = async (idUsuario, datos, archivo) => {
        recibido = { idUsuario, datos, archivo };
        return { id_documento: 99 };
    };
    app = cargarApp();

    const res = await request(app)
        .post("/api/documentos")
        .set("Authorization", bearer(token(2, 7)))
        .field("id_pedido", "3")
        .field("id_tipo", "1")
        .field("id_plataforma", "2")
        .attach("archivo", PDF, {
            filename: "factura.pdf",
            contentType: "application/pdf"
        });

    assert.equal(res.status, 201);
    assert.deepEqual(res.body, {
        mensaje: "Documento subido correctamente",
        documento: { id_documento: 99 }
    });
    // La identidad sale del token, no del formulario.
    assert.equal(recibido.idUsuario, 7);
    // Los ids del multipart llegan coercionados a numero por zod.
    assert.deepEqual(recibido.datos, {
        id_pedido: 3,
        id_tipo: 1,
        id_plataforma: 2
    });
    // El nombre en disco lo genero el servidor; el del cliente queda aparte.
    assert.match(recibido.archivo.filename, /^[0-9a-f]{32}\.pdf$/);
    assert.equal(recibido.archivo.originalname, "factura.pdf");
});

test("POST /api/documentos con rol auditor responde 403 SIN escribir en disco", async () => {
    const res = await request(app)
        .post("/api/documentos")
        .set("Authorization", bearer(token(3)))
        .field("id_pedido", "3")
        .field("id_tipo", "1")
        .field("id_plataforma", "2")
        .attach("archivo", PDF, {
            filename: "factura.pdf",
            contentType: "application/pdf"
        });

    assert.equal(res.status, 403);
    assert.equal(
        res.body.mensaje,
        "No tienes permiso para realizar esta acción"
    );
    // requerirRol va ANTES de multer: a quien no puede subir no se le escribe
    // un byte. Si se invirtiera el orden, este assert cae.
    assert.deepEqual(archivosEnDisco(), []);
});

test("POST /api/documentos con extension fuera de la allow-list responde 400", async () => {
    const res = await request(app)
        .post("/api/documentos")
        .set("Authorization", bearer(token(1)))
        .field("id_pedido", "3")
        .field("id_tipo", "1")
        .field("id_plataforma", "2")
        .attach("archivo", EJECUTABLE, {
            filename: "malware.exe",
            contentType: "application/octet-stream"
        });

    assert.equal(res.status, 400);
    assert.equal(res.body.mensaje, "Solo se permiten archivos PDF, PNG o JPG");
    // El fileFilter rechaza antes de escribir: no queda nada en disco.
    assert.deepEqual(archivosEnDisco(), []);
});

test("POST /api/documentos con archivo mayor al tope responde 400", async () => {
    const grande = Buffer.concat([PDF, Buffer.alloc(4096, 0x41)]);

    const res = await request(app)
        .post("/api/documentos")
        .set("Authorization", bearer(token(1)))
        .field("id_pedido", "3")
        .field("id_tipo", "1")
        .field("id_plataforma", "2")
        .attach("archivo", grande, {
            filename: "gordo.pdf",
            contentType: "application/pdf"
        });

    assert.equal(res.status, 400);
    assert.equal(
        res.body.mensaje,
        "El archivo supera el tamaño máximo permitido"
    );
    // Multer corta el stream y el handler central borra el trozo ya escrito.
    assert.ok(await esperarHasta(() => archivosEnDisco().length === 0));
});

test("POST /api/documentos con id invalido responde 400 y BORRA el archivo huerfano", async () => {
    const res = await request(app)
        .post("/api/documentos")
        .set("Authorization", bearer(token(1)))
        .field("id_pedido", "0")
        .field("id_tipo", "1")
        .field("id_plataforma", "2")
        .attach("archivo", PDF, {
            filename: "factura.pdf",
            contentType: "application/pdf"
        });

    assert.equal(res.status, 400);
    assert.equal(res.body.mensaje, "Debe seleccionar un pedido válido");
    // El archivo ya estaba escrito cuando zod rechazo el formulario: sin la
    // limpieza del handler central quedaria para siempre sin fila que lo apunte.
    assert.ok(await esperarHasta(() => archivosEnDisco().length === 0));
});

test("POST /api/documentos: si el service falla, el archivo tampoco queda huerfano", async () => {
    servicioMock.crear = async () => {
        throw new Error("caida del driver");
    };
    app = cargarApp();

    const res = await request(app)
        .post("/api/documentos")
        .set("Authorization", bearer(token(1)))
        .field("id_pedido", "3")
        .field("id_tipo", "1")
        .field("id_plataforma", "2")
        .attach("archivo", PDF, {
            filename: "factura.pdf",
            contentType: "application/pdf"
        });

    assert.equal(res.status, 500);
    assert.equal(res.body.mensaje, "Ocurrió un error interno en el servidor");
    assert.ok(await esperarHasta(() => archivosEnDisco().length === 0));
});

test("GET /api/documentos/:id/descargar sirve el archivo como adjunto", async () => {
    await fsp.writeFile(path.join(DIR_TEMP, "descargable.pdf"), PDF);

    const res = await request(app)
        .get("/api/documentos/5/descargar")
        .set("Authorization", bearer(token(3)));

    assert.equal(res.status, 200);
    // octet-stream + attachment: el navegador lo baja, nunca lo interpreta en
    // el origen de la app.
    assert.equal(res.headers["content-type"], "application/octet-stream");
    assert.match(res.headers["content-disposition"], /^attachment/);
    assert.match(res.headers["content-disposition"], /factura marzo\.pdf/);
    assert.equal(res.headers["x-content-type-options"], "nosniff");
});

test("GET /api/documentos/:id/descargar sin token responde 401", async () => {
    const res = await request(app).get("/api/documentos/5/descargar");
    assert.equal(res.status, 401);
});

test("GET /api/documentos/:id/descargar con id no numerico responde 400", async () => {
    const res = await request(app)
        .get("/api/documentos/abc/descargar")
        .set("Authorization", bearer(token(1)));

    assert.equal(res.status, 400);
    assert.equal(res.body.mensaje, "El ID del documento no es válido");
});

test("GET /api/documentos/:id/descargar inexistente responde 404", async () => {
    servicioMock.obtenerParaDescarga = async () => {
        throw new ErrorNoEncontrado("Documento no encontrado");
    };
    app = cargarApp();

    const res = await request(app)
        .get("/api/documentos/999/descargar")
        .set("Authorization", bearer(token(1)));

    assert.equal(res.status, 404);
    assert.equal(res.body.mensaje, "Documento no encontrado");
});

test("DELETE /api/documentos/:id con rol admin responde 200", async () => {
    let idAuditor;
    servicioMock.eliminar = async (idUsuario) => {
        idAuditor = idUsuario;
        return { id_documento: 5 };
    };
    app = cargarApp();

    const res = await request(app)
        .delete("/api/documentos/5")
        .set("Authorization", bearer(token(1, 77)));

    assert.equal(res.status, 200);
    assert.equal(res.body.mensaje, "Documento eliminado correctamente");
    assert.equal(idAuditor, 77);
});

test("DELETE /api/documentos/:id con rol operador responde 403", async () => {
    const res = await request(app)
        .delete("/api/documentos/5")
        .set("Authorization", bearer(token(2)));

    assert.equal(res.status, 403);
    assert.equal(
        res.body.mensaje,
        "No tienes permiso para realizar esta acción"
    );
});

test("GET /uploads ya no sirve archivos estaticos", async () => {
    await fsp.writeFile(path.join(DIR_TEMP, "descargable.pdf"), PDF);

    // Sin token y por ruta directa: antes esto devolvia el archivo a cualquiera.
    const res = await request(app).get("/uploads/descargable.pdf");

    assert.equal(res.status, 404);
    assert.equal(res.body.mensaje, "Ruta no encontrada");
});
