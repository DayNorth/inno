// Tests de integracion de las rutas de clientes con supertest. El service se
// mockea (no se toca SQL); verificarToken se ejerce de verdad con un JWT
// firmado con el secreto de prueba. Se comprueba: status codes, sobre
// { mensaje } EXACTO, validacion zod (400), 404, 403 por rol, mapeo de errores
// y que la identidad fluye desde req.usuario (token), nunca del body.
const { test, before, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { fijarEnvDePrueba } = require("../helpers/env");
const {
    mockModule,
    limpiarCache,
    crearLoggerSilencioso
} = require("../helpers/mockModule");
const { ErrorNoEncontrado, ErrorValidacion } = require("../../errors/AppError");

fijarEnvDePrueba();

const jwt = require("jsonwebtoken");
const request = require("supertest");

function bearer(token) {
    return "Bearer " + token;
}

function tokenAdmin() {
    return jwt.sign(
        { id_usuario: 42, correo: "admin@x.co", id_rol: 1, rol: "Admin" },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
    );
}

function tokenAuditor() {
    return jwt.sign(
        { id_usuario: 7, correo: "aud@x.co", id_rol: 3, rol: "Auditor" },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
    );
}

// Módulos de la cadena que consumen el service mockeado; se recargan enteros
// para que un cambio en el mock (dentro de un test) se refleje en la app.
const cadena = [
    "../../services/clientes.service",
    "../../controllers/clientes.controller",
    "../../routes/clientes",
    "../../app"
];

let servicioMock;
let app;

function cargarApp() {
    limpiarCache(...cadena);
    mockModule("../../services/clientes.service", servicioMock);
    return require(path.resolve(__dirname, "../../app"));
}

before(() => {
    mockModule("../../db", { poolPromise: Promise.resolve({}), sql: {} });
    mockModule("../../logger", crearLoggerSilencioso());
});

beforeEach(() => {
    servicioMock = {
        listarActivos: async () => [{ id_cliente: 1, nombre: "A" }],
        listarTodos: async () => [
            { id_cliente: 1, nombre: "A", estado: "Activo" },
            { id_cliente: 2, nombre: "B", estado: "Inactivo" }
        ],
        obtenerPorId: async () => ({ id_cliente: 1, nombre: "A" }),
        crear: async () => ({ id_cliente: 99, nombre: "Nueva" }),
        actualizar: async () => ({ id_cliente: 5, nombre: "Edit" }),
        inactivar: async () => ({ id_cliente: 5, nombre: "A" }),
        reactivar: async () => ({ id_cliente: 5, nombre: "A" })
    };
    app = cargarApp();
});

afterEach(() => {
    limpiarCache(...cadena);
});

test("GET /api/clientes sin token responde 401", async () => {
    const res = await request(app).get("/api/clientes");
    assert.equal(res.status, 401);
    assert.deepEqual(res.body, { mensaje: "Token no proporcionado" });
});

test("GET /api/clientes con token responde 200 y array", async () => {
    const res = await request(app)
        .get("/api/clientes")
        .set("Authorization", bearer(tokenAdmin()));
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.equal(res.body[0].id_cliente, 1);
});

test("GET /api/clientes/todos responde 200 y array completo", async () => {
    const res = await request(app)
        .get("/api/clientes/todos")
        .set("Authorization", bearer(tokenAdmin()));
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 2);
});

test("GET /api/clientes/:id con id invalido responde 400", async () => {
    const res = await request(app)
        .get("/api/clientes/abc")
        .set("Authorization", bearer(tokenAdmin()));
    assert.equal(res.status, 400);
    assert.deepEqual(res.body, { mensaje: "El ID del cliente no es válido" });
});

test("GET /api/clientes/:id inexistente responde 404", async () => {
    servicioMock.obtenerPorId = async () => {
        throw new ErrorNoEncontrado("Cliente no encontrado");
    };
    app = cargarApp();
    const res = await request(app)
        .get("/api/clientes/123")
        .set("Authorization", bearer(tokenAdmin()));
    assert.equal(res.status, 404);
    assert.deepEqual(res.body, { mensaje: "Cliente no encontrado" });
});

test("POST /api/clientes sin nombre responde 400", async () => {
    const res = await request(app)
        .post("/api/clientes")
        .set("Authorization", bearer(tokenAdmin()))
        .send({ pais: "CR" });
    assert.equal(res.status, 400);
    assert.deepEqual(res.body, {
        mensaje: "El nombre del cliente es obligatorio"
    });
});

test("POST /api/clientes valido responde 201 con sobre exacto", async () => {
    const res = await request(app)
        .post("/api/clientes")
        .set("Authorization", bearer(tokenAdmin()))
        .send({ nombre: "Nueva" });
    assert.equal(res.status, 201);
    assert.equal(res.body.mensaje, "Cliente creado correctamente");
    assert.equal(res.body.cliente.id_cliente, 99);
});

test("POST /api/clientes con rol no permitido responde 403", async () => {
    const res = await request(app)
        .post("/api/clientes")
        .set("Authorization", bearer(tokenAuditor()))
        .send({ nombre: "Nueva" });
    assert.equal(res.status, 403);
    assert.deepEqual(res.body, {
        mensaje: "No tienes permiso para realizar esta acción"
    });
});

test("POST /api/clientes usa la identidad del token, no del body", async () => {
    let idRecibido;
    servicioMock.crear = async (idUsuario) => {
        idRecibido = idUsuario;
        return { id_cliente: 1, nombre: "N" };
    };
    app = cargarApp();
    await request(app)
        .post("/api/clientes")
        .set("Authorization", bearer(tokenAdmin()))
        .send({ nombre: "N", id_usuario: 999 });
    assert.equal(idRecibido, 42);
});

test("PUT /api/clientes/:id valido responde 200 con sobre exacto", async () => {
    const res = await request(app)
        .put("/api/clientes/5")
        .set("Authorization", bearer(tokenAdmin()))
        .send({ nombre: "Edit" });
    assert.equal(res.status, 200);
    assert.equal(res.body.mensaje, "Cliente actualizado correctamente");
    assert.equal(res.body.cliente.id_cliente, 5);
});

test("PUT /api/clientes/:id con id invalido responde 400", async () => {
    const res = await request(app)
        .put("/api/clientes/xyz")
        .set("Authorization", bearer(tokenAdmin()))
        .send({});
    assert.equal(res.status, 400);
    assert.deepEqual(res.body, { mensaje: "El ID del cliente no es válido" });
});

test("PATCH inactivar responde 200 con mensaje exacto", async () => {
    const res = await request(app)
        .patch("/api/clientes/5/inactivar")
        .set("Authorization", bearer(tokenAdmin()));
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { mensaje: "Cliente inactivado correctamente" });
});

test("PATCH inactivar inexistente responde 404 con mensaje exacto", async () => {
    servicioMock.inactivar = async () => {
        throw new ErrorNoEncontrado("Cliente no encontrado o ya está inactivo");
    };
    app = cargarApp();
    const res = await request(app)
        .patch("/api/clientes/5/inactivar")
        .set("Authorization", bearer(tokenAdmin()));
    assert.equal(res.status, 404);
    assert.deepEqual(res.body, {
        mensaje: "Cliente no encontrado o ya está inactivo"
    });
});

test("PATCH reactivar responde 200 con mensaje exacto", async () => {
    const res = await request(app)
        .patch("/api/clientes/5/reactivar")
        .set("Authorization", bearer(tokenAdmin()));
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { mensaje: "Cliente reactivado correctamente" });
});

test("ruta inexistente responde 404 Ruta no encontrada", async () => {
    const res = await request(app)
        .get("/api/no-existe")
        .set("Authorization", bearer(tokenAdmin()));
    assert.equal(res.status, 404);
    assert.deepEqual(res.body, { mensaje: "Ruta no encontrada" });
});

test("ErrorValidacion del service se mapea a 400", async () => {
    servicioMock.listarActivos = async () => {
        throw new ErrorValidacion("dato invalido");
    };
    app = cargarApp();
    const res = await request(app)
        .get("/api/clientes")
        .set("Authorization", bearer(tokenAdmin()));
    assert.equal(res.status, 400);
    assert.deepEqual(res.body, { mensaje: "dato invalido" });
});

test("error no operacional se mapea a 500 generico", async () => {
    servicioMock.listarActivos = async () => {
        throw new Error("detalle interno con SQL secreto");
    };
    app = cargarApp();
    const res = await request(app)
        .get("/api/clientes")
        .set("Authorization", bearer(tokenAdmin()));
    assert.equal(res.status, 500);
    assert.deepEqual(res.body, {
        mensaje: "Ocurrió un error interno en el servidor"
    });
});
