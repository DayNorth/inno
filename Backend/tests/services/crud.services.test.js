// Tests de los services de CRUDs simples con repos y BD mockeados. Verifican la
// traducción de errores SQL a AppError con el mensaje EXACTO, el cálculo de
// estado_seguridad de dispositivos, y los textos de Bitacora.
const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { mockModule, limpiarCache } = require("../helpers/mockModule");

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

function errSql(number) {
    const e = new Error("sql");
    e.number = number;
    return e;
}

function cargar(rel) {
    const ruta = require.resolve(path.resolve(__dirname, rel));
    delete require.cache[ruta];
    return require(ruta);
}

let ev;

beforeEach(() => {
    const f = fakeSql();
    ev = f.eventos;
    mockModule("../../db", {
        poolPromise: Promise.resolve({}),
        sql: f.sql
    });
    mockModule("../../logger", {
        info() {},
        warn() {},
        error() {},
        debug() {}
    });
    mockModule("../../repositories/bitacora.repository", {
        registrar: async () => {},
        listar: async () => []
    });
});

afterEach(() => {
    limpiarCache(
        "../../db",
        "../../logger",
        "../../utils/transacciones",
        "../../repositories/bitacora.repository",
        "../../repositories/dispositivos.repository",
        "../../repositories/incidentes.repository",
        "../../repositories/accesos.repository",
        "../../repositories/productos.repository",
        "../../services/dispositivos.service",
        "../../services/incidentes.service",
        "../../services/accesos.service",
        "../../services/productos.service"
    );
});

test("productos: violación única -> 409 mensaje exacto", async () => {
    mockModule("../../repositories/productos.repository", {
        insertar: async () => {
            throw errSql(2627);
        }
    });
    const svc = cargar("../../services/productos.service");
    await assert.rejects(() => svc.crear({ nombre_producto: "X" }), (e) => {
        assert.equal(e.status, 409);
        assert.equal(e.message, "Ya existe un producto con ese nombre");
        return true;
    });
});

test("dispositivos: estado_seguridad Cumple con antivirus y ups", async () => {
    let estadoInsertado;
    mockModule("../../repositories/dispositivos.repository", {
        insertar: async (_tx, datos) => {
            estadoInsertado = datos.estado_seguridad;
            return { id_dispositivo: 1, codigo_equipo: "EQ" };
        }
    });
    const svc = cargar("../../services/dispositivos.service");
    await svc.crear(5, {
        antivirus_activo: true,
        tiene_ups: true,
        codigo_equipo: "EQ"
    });
    assert.equal(estadoInsertado, "Cumple");
    assert.equal(ev.commits, 1);
});

test("dispositivos: estado_seguridad No cumple si falta ups", async () => {
    let estadoInsertado;
    mockModule("../../repositories/dispositivos.repository", {
        insertar: async (_tx, datos) => {
            estadoInsertado = datos.estado_seguridad;
            return { id_dispositivo: 1, codigo_equipo: "EQ" };
        }
    });
    const svc = cargar("../../services/dispositivos.service");
    await svc.crear(5, { antivirus_activo: true, tiene_ups: false });
    assert.equal(estadoInsertado, "No cumple");
});

test("dispositivos: FK 547 -> 409 mensaje exacto y rollback", async () => {
    mockModule("../../repositories/dispositivos.repository", {
        insertar: async () => {
            throw errSql(547);
        }
    });
    const svc = cargar("../../services/dispositivos.service");
    await assert.rejects(() => svc.crear(5, {}), (e) => {
        assert.equal(e.status, 409);
        assert.equal(e.message, "El usuario responsable indicado no existe");
        return true;
    });
    assert.equal(ev.rollbacks, 1);
});

test("incidentes: FK 547 -> 409 mensaje exacto", async () => {
    mockModule("../../repositories/incidentes.repository", {
        insertar: async () => {
            throw errSql(547);
        },
        resolver: async () => null
    });
    const svc = cargar("../../services/incidentes.service");
    await assert.rejects(() => svc.reportar(5, {}), (e) => {
        assert.equal(e.status, 409);
        assert.equal(e.message, "La plataforma o el responsable indicado no existe");
        return true;
    });
});

test("incidentes: resolver inexistente -> 404 mensaje exacto", async () => {
    mockModule("../../repositories/incidentes.repository", {
        insertar: async () => ({}),
        resolver: async () => null
    });
    const svc = cargar("../../services/incidentes.service");
    await assert.rejects(() => svc.resolver(5, 9, null), (e) => {
        assert.equal(e.status, 404);
        assert.equal(e.message, "Incidente no encontrado o ya está resuelto");
        return true;
    });
    assert.equal(ev.rollbacks, 1);
});

test("accesos: FK 547 -> 409 mensaje exacto", async () => {
    mockModule("../../repositories/accesos.repository", {
        insertar: async () => {
            throw errSql(547);
        },
        marcarRevisado: async () => null,
        revocar: async () => null
    });
    const svc = cargar("../../services/accesos.service");
    await assert.rejects(
        () => svc.crear(5, { id_plataforma: 1, id_usuario: 2 }),
        (e) => {
            assert.equal(e.status, 409);
            assert.equal(e.message, "El usuario o la plataforma indicada no existe");
            return true;
        }
    );
});

test("accesos: revisar inexistente -> 404 Acceso no encontrado", async () => {
    mockModule("../../repositories/accesos.repository", {
        insertar: async () => ({}),
        marcarRevisado: async () => null,
        revocar: async () => null
    });
    const svc = cargar("../../services/accesos.service");
    await assert.rejects(() => svc.revisar(5, 9), (e) => {
        assert.equal(e.status, 404);
        assert.equal(e.message, "Acceso no encontrado");
        return true;
    });
});

test("accesos: revocar ya revocado -> 404 mensaje exacto", async () => {
    mockModule("../../repositories/accesos.repository", {
        insertar: async () => ({}),
        marcarRevisado: async () => ({}),
        revocar: async () => null
    });
    const svc = cargar("../../services/accesos.service");
    await assert.rejects(() => svc.revocar(5, 9), (e) => {
        assert.equal(e.status, 404);
        assert.equal(e.message, "Acceso no encontrado o ya está revocado");
        return true;
    });
});
