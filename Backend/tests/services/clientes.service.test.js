// Tests del service de clientes con repositorios y BD mockeados (sin SQL real).
// Verifican: orquestacion por endpoint, textos EXACTOS de Bitacora, que la
// identidad proviene del argumento (token) y no del cuerpo, el mapeo a
// ErrorNoEncontrado (404), y el commit/rollback de la transaccion.
const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { mockModule, limpiarCache } = require("../helpers/mockModule");

function crearFakeSql() {
    const eventos = { begins: 0, commits: 0, rollbacks: 0 };

    class FakeTransaction {
        constructor(_pool) {
            this._pool = _pool;
        }
        async begin() {
            eventos.begins++;
        }
        async commit() {
            eventos.commits++;
        }
        async rollback() {
            eventos.rollbacks++;
        }
    }

    return {
        eventos,
        sql: { Transaction: FakeTransaction, Request: class {} }
    };
}

function cargarService() {
    const ruta = require.resolve(
        path.resolve(__dirname, "../../services/clientes.service")
    );
    delete require.cache[ruta];
    return require(ruta);
}

let clientesRepoMock;
let bitacoraRepoMock;
let fakeSql;
let servicio;

beforeEach(() => {
    fakeSql = crearFakeSql();

    mockModule("../../db", {
        poolPromise: Promise.resolve({ __esPool: true }),
        sql: fakeSql.sql
    });

    mockModule("../../logger", {
        info() {},
        warn() {},
        error() {},
        debug() {}
    });

    clientesRepoMock = {
        listarActivos: async () => [{ id_cliente: 1, estado: "Activo" }],
        listarTodos: async () => [
            { id_cliente: 1, estado: "Activo" },
            { id_cliente: 2, estado: "Inactivo" }
        ],
        obtenerPorId: async () => null,
        insertar: async () => ({ id_cliente: 10, nombre: "ACME" }),
        actualizar: async () => ({ id_cliente: 10, nombre: "ACME 2" }),
        cambiarEstado: async () => ({ id_cliente: 10, nombre: "ACME" })
    };
    bitacoraRepoMock = { registrar: async () => {}, listar: async () => [] };

    mockModule("../../repositories/clientes.repository", clientesRepoMock);
    mockModule("../../repositories/bitacora.repository", bitacoraRepoMock);

    servicio = cargarService();
});

afterEach(() => {
    limpiarCache(
        "../../db",
        "../../logger",
        "../../repositories/clientes.repository",
        "../../repositories/bitacora.repository",
        "../../utils/transacciones",
        "../../services/clientes.service"
    );
});

test("listarActivos delega en el repo y devuelve el array", async () => {
    const r = await servicio.listarActivos();
    assert.deepEqual(r, [{ id_cliente: 1, estado: "Activo" }]);
});

test("listarTodos devuelve activos e inactivos", async () => {
    const r = await servicio.listarTodos();
    assert.equal(r.length, 2);
});

test("obtenerPorId lanza ErrorNoEncontrado (404) si no existe", async () => {
    await assert.rejects(
        () => servicio.obtenerPorId(999),
        (err) => {
            assert.equal(err.status, 404);
            assert.equal(err.message, "Cliente no encontrado");
            return true;
        }
    );
});

test("obtenerPorId devuelve el cliente si existe", async () => {
    clientesRepoMock.obtenerPorId = async () => ({ id_cliente: 5, nombre: "X" });
    servicio = cargarService();
    const r = await servicio.obtenerPorId(5);
    assert.equal(r.id_cliente, 5);
});

test("crear registra Bitacora con el texto exacto y commitea", async () => {
    let accionRegistrada;
    let idUsuarioRegistrado;
    bitacoraRepoMock.registrar = async (_tx, idUsuario, accion) => {
        idUsuarioRegistrado = idUsuario;
        accionRegistrada = accion;
    };
    clientesRepoMock.insertar = async () => ({
        id_cliente: 77,
        nombre: "Nueva SA"
    });
    servicio = cargarService();

    const cliente = await servicio.crear(42, {
        nombre: "Nueva SA",
        pais: null,
        correo: null,
        telefono: null
    });

    assert.equal(cliente.id_cliente, 77);
    assert.equal(accionRegistrada, "Creó el cliente ID 77: Nueva SA");
    assert.equal(idUsuarioRegistrado, 42);
    assert.equal(fakeSql.eventos.commits, 1);
    assert.equal(fakeSql.eventos.rollbacks, 0);
});

test("crear hace rollback si la Bitacora falla y propaga el error", async () => {
    bitacoraRepoMock.registrar = async () => {
        throw new Error("fallo al auditar");
    };
    servicio = cargarService();

    await assert.rejects(
        () => servicio.crear(1, { nombre: "X" }),
        /fallo al auditar/
    );
    assert.equal(fakeSql.eventos.commits, 0);
    assert.equal(fakeSql.eventos.rollbacks, 1);
});

test("actualizar lanza 404 y hace rollback si no existe", async () => {
    clientesRepoMock.actualizar = async () => null;
    servicio = cargarService();

    await assert.rejects(
        () => servicio.actualizar(1, 5, { nombre: "X" }),
        (err) => {
            assert.equal(err.status, 404);
            assert.equal(err.message, "Cliente no encontrado");
            return true;
        }
    );
    assert.equal(fakeSql.eventos.rollbacks, 1);
    assert.equal(fakeSql.eventos.commits, 0);
});

test("actualizar audita con el texto exacto usando el id de la ruta", async () => {
    let accion;
    bitacoraRepoMock.registrar = async (_tx, _id, a) => {
        accion = a;
    };
    clientesRepoMock.actualizar = async () => ({
        id_cliente: 5,
        nombre: "Editada"
    });
    servicio = cargarService();

    await servicio.actualizar(9, 5, { nombre: "Editada" });
    assert.equal(accion, "Actualizó el cliente ID 5: Editada");
    assert.equal(fakeSql.eventos.commits, 1);
});

test("inactivar: 404 con mensaje exacto si no aplica el cambio", async () => {
    clientesRepoMock.cambiarEstado = async () => null;
    servicio = cargarService();

    await assert.rejects(
        () => servicio.inactivar(1, 5),
        (err) => {
            assert.equal(err.status, 404);
            assert.equal(
                err.message,
                "Cliente no encontrado o ya está inactivo"
            );
            return true;
        }
    );
});

test("inactivar audita con el texto exacto y commitea", async () => {
    let accion;
    bitacoraRepoMock.registrar = async (_tx, _id, a) => {
        accion = a;
    };
    clientesRepoMock.cambiarEstado = async () => ({
        id_cliente: 5,
        nombre: "ACME"
    });
    servicio = cargarService();

    await servicio.inactivar(3, 5);
    assert.equal(accion, "Inactivó el cliente ID 5: ACME");
    assert.equal(fakeSql.eventos.commits, 1);
});

test("reactivar: 404 con mensaje exacto si no aplica el cambio", async () => {
    clientesRepoMock.cambiarEstado = async () => null;
    servicio = cargarService();

    await assert.rejects(
        () => servicio.reactivar(1, 5),
        (err) => {
            assert.equal(err.status, 404);
            assert.equal(err.message, "Cliente no encontrado o ya está activo");
            return true;
        }
    );
});

test("reactivar audita con el texto exacto y commitea", async () => {
    let accion;
    bitacoraRepoMock.registrar = async (_tx, _id, a) => {
        accion = a;
    };
    clientesRepoMock.cambiarEstado = async () => ({
        id_cliente: 8,
        nombre: "ReAct"
    });
    servicio = cargarService();

    await servicio.reactivar(3, 8);
    assert.equal(accion, "Reactivó el cliente ID 8: ReAct");
    assert.equal(fakeSql.eventos.commits, 1);
});
