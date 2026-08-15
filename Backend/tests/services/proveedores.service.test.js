// Tests del calculo puro calcularEvaluacion (umbrales 70/85/60 y combinaciones)
// y del service de proveedores con repos y BD mockeados (sin SQL real). Se
// verifica: traduccion de FK 547 a ErrorConflicto con el mensaje EXACTO de
// contrato, rollback en fallo, 404 en GET /:id inexistente, y los textos de
// Bitacora caracter por caracter. Sigue el estilo de crud.services.test.js.
const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { mockModule, limpiarCache } = require("../helpers/mockModule");
const { calcularEvaluacion } = require("../../utils/evaluacionProveedor");

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
    return {
        eventos,
        sql: { Transaction: FakeTransaction, Request: class {} }
    };
}

function errSql(number) {
    const e = new Error("sql");
    e.number = number;
    return e;
}

function cargarService() {
    const ruta = require.resolve(
        path.resolve(__dirname, "../../services/proveedores.service")
    );
    delete require.cache[ruta];
    return require(ruta);
}

let ev;
let repoMock;
let bitacoraMock;
let servicio;

beforeEach(() => {
    const f = fakeSql();
    ev = f.eventos;

    mockModule("../../db", { poolPromise: Promise.resolve({}), sql: f.sql });
    mockModule("../../logger", {
        info() {},
        warn() {},
        error() {},
        debug() {}
    });

    repoMock = {
        listar: async () => [{ id_proveedor: 1 }],
        obtenerCabecera: async () => ({
            id_proveedor: 5,
            nombre_proveedor: "ACME"
        }),
        listarEvaluaciones: async () => [{ id_evaluacion: 9 }],
        listarPlanes: async () => [{ id_plan: 3 }],
        insertarProveedor: async () => ({
            id_proveedor: 77,
            nombre_proveedor: "Nube SA"
        }),
        insertarEvaluacion: async () => ({
            id_evaluacion: 10,
            puntaje_total: 75,
            resultado: "Aprobado",
            nivel_riesgo: "Medio"
        }),
        insertarPlan: async () => ({ id_plan: 42, escenario: "Caida total" })
    };
    bitacoraMock = { registrar: async () => {}, listar: async () => [] };

    mockModule("../../repositories/proveedores.repository", repoMock);
    mockModule("../../repositories/bitacora.repository", bitacoraMock);

    servicio = cargarService();
});

afterEach(() => {
    limpiarCache(
        "../../db",
        "../../logger",
        "../../utils/transacciones",
        "../../repositories/proveedores.repository",
        "../../repositories/bitacora.repository",
        "../../services/proveedores.service"
    );
});

test("calcularEvaluacion: 0 criterios da 0 puntos, Rechazado, Alto", () => {
    const r = calcularEvaluacion({});
    assert.deepEqual(r, {
        puntaje: 0,
        resultado: "Rechazado",
        nivelRiesgo: "Alto"
    });
});

test("calcularEvaluacion: 1 criterio da 25, Rechazado, Alto", () => {
    const r = calcularEvaluacion({ cifrado_datos: true });
    assert.deepEqual(r, {
        puntaje: 25,
        resultado: "Rechazado",
        nivelRiesgo: "Alto"
    });
});

test("calcularEvaluacion: 2 criterios dan 50, Rechazado, Alto", () => {
    const r = calcularEvaluacion({
        cifrado_datos: true,
        mfa_disponible: true
    });
    assert.equal(r.puntaje, 50);
    assert.equal(r.resultado, "Rechazado");
    assert.equal(r.nivelRiesgo, "Alto");
});

test("calcularEvaluacion: 3 criterios dan 75, Aprobado, Medio", () => {
    const r = calcularEvaluacion({
        cifrado_datos: true,
        mfa_disponible: true,
        sla_definido: true
    });
    assert.deepEqual(r, {
        puntaje: 75,
        resultado: "Aprobado",
        nivelRiesgo: "Medio"
    });
});

test("calcularEvaluacion: 4 criterios dan 100, Aprobado, Bajo", () => {
    const r = calcularEvaluacion({
        cifrado_datos: true,
        mfa_disponible: true,
        sla_definido: true,
        certificaciones_vigentes: true
    });
    assert.deepEqual(r, {
        puntaje: 100,
        resultado: "Aprobado",
        nivelRiesgo: "Bajo"
    });
});

test("calcularEvaluacion: valores truthy no booleanos cuentan", () => {
    const r = calcularEvaluacion({
        cifrado_datos: 1,
        mfa_disponible: "si",
        sla_definido: {},
        certificaciones_vigentes: 0
    });
    assert.equal(r.puntaje, 75);
});

test("crear: inserta proveedor, evaluacion inicial y Bitacora, y commitea", async () => {
    let accion;
    let idUsuarioRegistrado;
    bitacoraMock.registrar = async (_tx, idUsuario, a) => {
        idUsuarioRegistrado = idUsuario;
        accion = a;
    };
    servicio = cargarService();

    const prov = await servicio.crear(42, {
        nombre_proveedor: "Nube SA",
        tipo_servicio: null,
        cifrado_datos: true,
        mfa_disponible: true,
        sla_definido: true,
        certificaciones_vigentes: false
    });

    assert.equal(prov.id_proveedor, 77);
    assert.equal(prov.puntaje_total, 75);
    assert.equal(prov.resultado, "Aprobado");
    assert.equal(prov.nivel_riesgo, "Medio");
    assert.equal(
        accion,
        "Evaluó al proveedor ID 77: Nube SA (Aprobado, 75/100)"
    );
    assert.equal(idUsuarioRegistrado, 42);
    assert.equal(ev.commits, 1);
    assert.equal(ev.rollbacks, 0);
});

test("crear: rollback si la evaluacion inicial falla y propaga el error", async () => {
    repoMock.insertarEvaluacion = async () => {
        throw new Error("fallo al insertar evaluacion");
    };
    servicio = cargarService();

    await assert.rejects(
        () => servicio.crear(1, { nombre_proveedor: "X" }),
        /fallo al insertar evaluacion/
    );
    assert.equal(ev.commits, 0);
    assert.equal(ev.rollbacks, 1);
});

test("registrarEvaluacion: FK 547 da 409 con mensaje EXACTO y rollback", async () => {
    repoMock.insertarEvaluacion = async () => {
        throw errSql(547);
    };
    servicio = cargarService();

    await assert.rejects(
        () => servicio.registrarEvaluacion(5, 999, {}),
        (e) => {
            assert.equal(e.status, 409);
            assert.equal(e.message, "El proveedor indicado no existe");
            return true;
        }
    );
    assert.equal(ev.rollbacks, 1);
});

test("registrarEvaluacion: audita con el texto EXACTO usando id de ruta", async () => {
    let accion;
    bitacoraMock.registrar = async (_tx, _id, a) => {
        accion = a;
    };
    repoMock.insertarEvaluacion = async () => ({
        id_evaluacion: 30,
        puntaje_total: 50,
        resultado: "Rechazado",
        nivel_riesgo: "Alto"
    });
    servicio = cargarService();

    const evaluacion = await servicio.registrarEvaluacion(9, 5, {
        cifrado_datos: true,
        mfa_disponible: true
    });

    assert.equal(evaluacion.id_evaluacion, 30);
    assert.equal(
        accion,
        "Registró una nueva evaluación de seguridad para el proveedor ID 5 (Rechazado, 50/100)"
    );
    assert.equal(ev.commits, 1);
});

test("registrarPlan: FK 547 da 409 con mensaje EXACTO y rollback", async () => {
    repoMock.insertarPlan = async () => {
        throw errSql(547);
    };
    servicio = cargarService();

    await assert.rejects(
        () =>
            servicio.registrarPlan(5, 999, {
                escenario: "X",
                procedimiento_alterno: "Y",
                responsable: null
            }),
        (e) => {
            assert.equal(e.status, 409);
            assert.equal(e.message, "El proveedor indicado no existe");
            return true;
        }
    );
    assert.equal(ev.rollbacks, 1);
});

test("registrarPlan: audita con el texto EXACTO y commitea", async () => {
    let accion;
    bitacoraMock.registrar = async (_tx, _id, a) => {
        accion = a;
    };
    repoMock.insertarPlan = async () => ({
        id_plan: 42,
        escenario: "Caida total"
    });
    servicio = cargarService();

    const plan = await servicio.registrarPlan(9, 5, {
        escenario: "Caida total",
        procedimiento_alterno: "Failover a DR",
        responsable: "Ops"
    });

    assert.equal(plan.id_plan, 42);
    assert.equal(
        accion,
        "Registró el plan de contingencia ID 42 para el proveedor ID 5"
    );
    assert.equal(ev.commits, 1);
});

test("obtenerDetalle: 404 con mensaje EXACTO si el proveedor no existe", async () => {
    repoMock.obtenerCabecera = async () => null;
    servicio = cargarService();

    await assert.rejects(
        () => servicio.obtenerDetalle(999),
        (e) => {
            assert.equal(e.status, 404);
            assert.equal(e.message, "Proveedor no encontrado");
            return true;
        }
    );
});

test("obtenerDetalle: devuelve cabecera, evaluaciones y planes_contingencia", async () => {
    const detalle = await servicio.obtenerDetalle(5);
    assert.equal(detalle.id_proveedor, 5);
    assert.ok(Array.isArray(detalle.evaluaciones));
    assert.ok(Array.isArray(detalle.planes_contingencia));
    assert.equal(detalle.evaluaciones[0].id_evaluacion, 9);
    assert.equal(detalle.planes_contingencia[0].id_plan, 3);
});
