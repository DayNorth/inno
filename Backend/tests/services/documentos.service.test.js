// Tests del documentos.service con repos, BD y utilidades de archivo mockeados.
// Verifican el contrato del modulo: la firma del binario se comprueba ANTES de
// tocar la BD, la identidad sale del token, la FK 547 se traduce al mensaje del
// contexto, y el archivo en disco se borra DESPUES del commit del delete.
const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { fijarEnvDePrueba } = require("../helpers/env");
const { mockModule, limpiarCache } = require("../helpers/mockModule");

fijarEnvDePrueba();

function fakeSql() {
    const eventos = { commits: 0, rollbacks: 0 };
    class FakeTransaction {
        async begin() {}
        async commit() {
            eventos.commits++;
        }
        async rollback() {
            eventos.rollbacks++;
        }
    }
    return { eventos, sql: { Transaction: FakeTransaction, Request: class {} } };
}

function cargarService() {
    const ruta = require.resolve(
        path.resolve(__dirname, "../../services/documentos.service")
    );
    delete require.cache[ruta];
    return require(ruta);
}

let ev;
let documentosMock;
let bitacoraMock;
let archivosMock;
let logsWarn;
let servicio;

// Objeto de multer tal como llega al service (archivo ya escrito en disco).
function archivoSubido(extra) {
    return {
        originalname: "factura marzo.pdf",
        mimetype: "application/pdf",
        filename: "a1b2c3d4e5f6.pdf",
        path: "/tmp/uploads/a1b2c3d4e5f6.pdf",
        size: 1024,
        ...extra
    };
}

const DATOS = { id_pedido: 3, id_tipo: 1, id_plataforma: 2 };

beforeEach(() => {
    const f = fakeSql();
    ev = f.eventos;
    logsWarn = [];

    mockModule("../../db", { poolPromise: Promise.resolve({}), sql: f.sql });
    mockModule("../../logger", {
        info() {},
        warn(obj, msg) {
            logsWarn.push({ obj, msg });
        },
        error() {},
        debug() {}
    });

    documentosMock = {
        listar: async () => [],
        obtenerParaDescarga: async () => null,
        insertar: async () => ({
            id_documento: 11,
            id_pedido: 3,
            nombre_archivo: "factura marzo.pdf"
        }),
        eliminar: async () => ({
            id_documento: 11,
            nombre_archivo: "factura marzo.pdf",
            ruta_archivo: "a1b2c3d4e5f6.pdf"
        })
    };

    bitacoraMock = { registrar: async () => {}, listar: async () => [] };

    archivosMock = {
        MENSAJE_TIPO_NO_PERMITIDO: "Solo se permiten archivos PDF, PNG o JPG",
        extensionDe: (n) => path.extname(String(n || "")).toLowerCase(),
        sanitizarNombreArchivo: (n) => n,
        verificarFirma: async () => true,
        rutaSeguraEnUploads: (r) => (r ? `/tmp/uploads/${r}` : null),
        borrarSilencioso: async () => true
    };

    mockModule("../../repositories/documentos.repository", documentosMock);
    mockModule("../../repositories/bitacora.repository", bitacoraMock);
    mockModule("../../utils/archivos", archivosMock);

    servicio = cargarService();
});

afterEach(() => {
    limpiarCache(
        "../../db",
        "../../logger",
        "../../utils/transacciones",
        "../../utils/archivos",
        "../../repositories/documentos.repository",
        "../../repositories/bitacora.repository",
        "../../services/documentos.service"
    );
});

test("crear: inserta el documento, audita y commitea", async () => {
    let datosInsertados;
    let accionBitacora;
    let idAuditor;
    documentosMock.insertar = async (_tx, datos) => {
        datosInsertados = datos;
        return { id_documento: 11, id_pedido: datos.id_pedido };
    };
    bitacoraMock.registrar = async (_tx, id, a) => {
        idAuditor = id;
        accionBitacora = a;
    };
    servicio = cargarService();

    const r = await servicio.crear(42, DATOS, archivoSubido());

    assert.equal(r.id_documento, 11);
    // La identidad viene del token (42), no del formulario.
    assert.equal(datosInsertados.id_usuario, 42);
    assert.equal(idAuditor, 42);
    // En BD se guarda el nombre generado por el servidor, no el del cliente.
    assert.equal(datosInsertados.ruta_archivo, "a1b2c3d4e5f6.pdf");
    assert.equal(datosInsertados.nombre_archivo, "factura marzo.pdf");
    assert.equal(accionBitacora, "Subió el documento ID 11 al pedido 3");
    assert.equal(ev.commits, 1);
});

test("crear: sin archivo adjunto -> 400", async () => {
    await assert.rejects(
        () => servicio.crear(42, DATOS, undefined),
        (e) => {
            assert.equal(e.status, 400);
            assert.equal(e.message, "Debe adjuntar un archivo");
            return true;
        }
    );
});

test("crear: firma que no coincide -> 400 y NO toca la BD", async () => {
    let insertLlamado = false;
    archivosMock.verificarFirma = async () => false;
    documentosMock.insertar = async () => {
        insertLlamado = true;
        return {};
    };
    servicio = cargarService();

    await assert.rejects(
        () => servicio.crear(42, DATOS, archivoSubido()),
        (e) => {
            assert.equal(e.status, 400);
            assert.equal(e.message, "Solo se permiten archivos PDF, PNG o JPG");
            return true;
        }
    );
    // Un ejecutable disfrazado de PDF nunca llega a tener fila.
    assert.equal(insertLlamado, false);
    assert.equal(ev.commits, 0);
});

test("crear: el nombre del cliente se guarda saneado", async () => {
    let datosInsertados;
    archivosMock.sanitizarNombreArchivo = () => "passwd";
    documentosMock.insertar = async (_tx, datos) => {
        datosInsertados = datos;
        return { id_documento: 11, id_pedido: datos.id_pedido };
    };
    servicio = cargarService();

    await servicio.crear(
        42,
        DATOS,
        archivoSubido({ originalname: "../../../etc/passwd" })
    );

    assert.equal(datosInsertados.nombre_archivo, "passwd");
});

test("crear: FK 547 -> 409 con el mensaje del contexto y rollback", async () => {
    documentosMock.insertar = async () => {
        const error = new Error("FK");
        error.number = 547;
        throw error;
    };
    servicio = cargarService();

    await assert.rejects(
        () => servicio.crear(42, DATOS, archivoSubido()),
        (e) => {
            assert.equal(e.status, 409);
            assert.equal(
                e.message,
                "El pedido, el tipo de documento o la plataforma indicada no existe"
            );
            return true;
        }
    );
    assert.equal(ev.rollbacks, 1);
    assert.equal(ev.commits, 0);
});

test("obtenerParaDescarga: devuelve ruta absoluta y nombre visible", async () => {
    documentosMock.obtenerParaDescarga = async () => ({
        id_documento: 11,
        nombre_archivo: "factura marzo.pdf",
        ruta_archivo: "a1b2c3d4e5f6.pdf"
    });
    // El service comprueba con fs.access que el archivo exista; se apunta a uno
    // que si existe (este propio test) para aislar el caso feliz del de disco.
    archivosMock.rutaSeguraEnUploads = () => __filename;
    servicio = cargarService();

    const r = await servicio.obtenerParaDescarga(11);

    assert.equal(r.rutaAbsoluta, __filename);
    assert.equal(r.nombreArchivo, "factura marzo.pdf");
});

test("obtenerParaDescarga: documento inexistente -> 404", async () => {
    documentosMock.obtenerParaDescarga = async () => null;
    servicio = cargarService();

    await assert.rejects(
        () => servicio.obtenerParaDescarga(999),
        (e) => {
            assert.equal(e.status, 404);
            assert.equal(e.message, "Documento no encontrado");
            return true;
        }
    );
});

test("obtenerParaDescarga: ruta que se sale de uploads -> 404 y warn", async () => {
    documentosMock.obtenerParaDescarga = async () => ({
        id_documento: 11,
        nombre_archivo: "x.pdf",
        ruta_archivo: "../../.env"
    });
    archivosMock.rutaSeguraEnUploads = () => null;
    servicio = cargarService();

    await assert.rejects(
        () => servicio.obtenerParaDescarga(11),
        (e) => {
            assert.equal(e.status, 404);
            assert.equal(
                e.message,
                "El archivo del documento no está disponible"
            );
            return true;
        }
    );
    assert.equal(logsWarn.length, 1);
});

test("obtenerParaDescarga: fila viva pero archivo ausente en disco -> 404", async () => {
    documentosMock.obtenerParaDescarga = async () => ({
        id_documento: 11,
        nombre_archivo: "x.pdf",
        ruta_archivo: "no-existe.pdf"
    });
    archivosMock.rutaSeguraEnUploads = () =>
        path.join(__dirname, "no-existe-jamas.pdf");
    servicio = cargarService();

    await assert.rejects(
        () => servicio.obtenerParaDescarga(11),
        (e) => {
            assert.equal(e.status, 404);
            assert.equal(
                e.message,
                "El archivo del documento no está disponible"
            );
            return true;
        }
    );
});

test("eliminar: borra fila, audita, commitea y borra el archivo DESPUES", async () => {
    const orden = [];
    let accionBitacora;
    documentosMock.eliminar = async () => {
        orden.push("delete");
        return {
            id_documento: 11,
            nombre_archivo: "f.pdf",
            ruta_archivo: "a1b2c3d4e5f6.pdf"
        };
    };
    bitacoraMock.registrar = async (_tx, _id, a) => {
        accionBitacora = a;
    };
    archivosMock.borrarSilencioso = async () => {
        orden.push("unlink");
        return true;
    };
    servicio = cargarService();

    await servicio.eliminar(42, 11);

    assert.equal(accionBitacora, "Eliminó el documento ID 11");
    assert.equal(ev.commits, 1);
    // El unlink no se revierte con un rollback: va despues de confirmar la baja.
    assert.deepEqual(orden, ["delete", "unlink"]);
});

test("eliminar: documento inexistente -> 404, rollback y sin tocar el disco", async () => {
    let unlinkLlamado = false;
    documentosMock.eliminar = async () => null;
    archivosMock.borrarSilencioso = async () => {
        unlinkLlamado = true;
        return true;
    };
    servicio = cargarService();

    await assert.rejects(
        () => servicio.eliminar(42, 999),
        (e) => {
            assert.equal(e.status, 404);
            assert.equal(e.message, "Documento no encontrado");
            return true;
        }
    );
    assert.equal(unlinkLlamado, false);
    assert.equal(ev.rollbacks, 1);
});

test("eliminar: si el unlink falla la baja NO se deshace, solo se advierte", async () => {
    archivosMock.borrarSilencioso = async () => false;
    servicio = cargarService();

    const r = await servicio.eliminar(42, 11);

    assert.equal(r.id_documento, 11);
    assert.equal(ev.commits, 1);
    assert.equal(logsWarn.length, 1);
    assert.match(logsWarn[0].msg, /sigue en disco/);
});

test("listar: delega en el repo", async () => {
    documentosMock.listar = async () => [{ id_documento: 1 }];
    servicio = cargarService();

    const r = await servicio.listar();
    assert.deepEqual(r, [{ id_documento: 1 }]);
});
