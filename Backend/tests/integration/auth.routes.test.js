// Tests de integracion de las rutas de auth con supertest. El auth.service se
// mockea (no se toca SQL). Verifican el contrato del gate: login setea la cookie
// httpOnly y NO devuelve el refresh en el body; refresh devuelve solo { token } y
// rota la cookie; logout borra la cookie y responde { mensaje }; la verificacion
// de Origin (Decision 1) devuelve 403 si el Origin no esta en la allowlist; el
// 401 de refresh es neutro. Sigue el estilo de clientes.routes.test.js.
const { test, before, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { fijarEnvDePrueba } = require("../helpers/env");
const {
    mockModule,
    limpiarCache,
    crearLoggerSilencioso
} = require("../helpers/mockModule");
const { ErrorNoAutorizado } = require("../../errors/AppError");

fijarEnvDePrueba();

const request = require("supertest");

const ORIGEN = "http://localhost:5173";

const cadena = [
    "../../services/auth.service",
    "../../controllers/auth.controller",
    "../../routes/auth",
    "../../app"
];

let servicioMock;
let app;

function cargarApp() {
    limpiarCache(...cadena);
    mockModule("../../services/auth.service", servicioMock);
    return require(path.resolve(__dirname, "../../app"));
}

before(() => {
    mockModule("../../db", { poolPromise: Promise.resolve({}), sql: {} });
    mockModule("../../logger", crearLoggerSilencioso());
});

beforeEach(() => {
    servicioMock = {
        login: async () => ({
            accessToken: "access-jwt-de-prueba",
            refreshTokenClaro: "refresh-opaco-de-prueba",
            usuario: { id_usuario: 7, nombre: "Admin", id_rol: 1 }
        }),
        refresh: async () => ({
            accessToken: "access-nuevo",
            refreshTokenClaro: "refresh-rotado"
        }),
        logout: async () => {},
        MENSAJE_SESION_EXPIRADA: "Sesion expirada"
    };
    app = cargarApp();
});

afterEach(() => {
    limpiarCache(...cadena);
});

test("POST /login responde 200 con { mensaje, token, usuario } y SIN refresh en el body", async () => {
    const res = await request(app)
        .post("/api/auth/login")
        .set("Origin", ORIGEN)
        .send({ correo: "admin@x.co", password: "secreta" });

    assert.equal(res.status, 200);
    assert.equal(res.body.mensaje, "Inicio de sesión correcto");
    assert.equal(res.body.token, "access-jwt-de-prueba");
    assert.equal(res.body.usuario.id_usuario, 7);
    // El refresh NUNCA en el body (Decision 4).
    assert.equal(res.body.refreshToken, undefined);
    assert.equal(res.body.refresh_token, undefined);
    assert.ok(!JSON.stringify(res.body).includes("refresh-opaco-de-prueba"));
});

test("POST /login setea la cookie de refresh httpOnly con los atributos del gate", async () => {
    const res = await request(app)
        .post("/api/auth/login")
        .set("Origin", ORIGEN)
        .send({ correo: "admin@x.co", password: "secreta" });

    const setCookie = res.headers["set-cookie"];
    assert.ok(Array.isArray(setCookie) && setCookie.length === 1);
    const cookie = setCookie[0];
    assert.match(cookie, /^refresh_token=refresh-opaco-de-prueba/);
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /Secure/i);
    assert.match(cookie, /SameSite=Strict/i);
    assert.match(cookie, /Path=\/api\/auth/i);
    assert.match(cookie, /Max-Age=\d+/i);
});

test("POST /login sin correo -> 400 con mensaje del legacy", async () => {
    const res = await request(app)
        .post("/api/auth/login")
        .set("Origin", ORIGEN)
        .send({ password: "secreta" });

    assert.equal(res.status, 400);
    assert.deepEqual(res.body, {
        mensaje: "Correo y contraseña son obligatorios"
    });
});

test("POST /login credenciales invalidas -> 401 (mapeo del AppError del service)", async () => {
    servicioMock.login = async () => {
        throw new ErrorNoAutorizado("Correo o contraseña incorrectos");
    };
    app = cargarApp();

    const res = await request(app)
        .post("/api/auth/login")
        .set("Origin", ORIGEN)
        .send({ correo: "admin@x.co", password: "mala" });

    assert.equal(res.status, 401);
    assert.deepEqual(res.body, { mensaje: "Correo o contraseña incorrectos" });
});

test("POST /refresh responde 200 con SOLO { token } y rota la cookie", async () => {
    const res = await request(app)
        .post("/api/auth/refresh")
        .set("Origin", ORIGEN)
        .set("Cookie", "refresh_token=refresh-viejo");

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { token: "access-nuevo" });
    // El refresh nuevo va SOLO en la cookie, nunca en el body.
    assert.ok(!JSON.stringify(res.body).includes("refresh-rotado"));
    const setCookie = res.headers["set-cookie"][0];
    assert.match(setCookie, /^refresh_token=refresh-rotado/);
    assert.match(setCookie, /HttpOnly/i);
});

test("POST /refresh pasa la cookie entrante al service", async () => {
    let recibido;
    servicioMock.refresh = async (tok) => {
        recibido = tok;
        return { accessToken: "a", refreshTokenClaro: "b" };
    };
    app = cargarApp();

    await request(app)
        .post("/api/auth/refresh")
        .set("Origin", ORIGEN)
        .set("Cookie", "refresh_token=valor-entrante");

    assert.equal(recibido, "valor-entrante");
});

test("POST /refresh con 401 neutro del service -> { mensaje: 'Sesion expirada' }", async () => {
    servicioMock.refresh = async () => {
        throw new ErrorNoAutorizado("Sesion expirada");
    };
    app = cargarApp();

    const res = await request(app)
        .post("/api/auth/refresh")
        .set("Origin", ORIGEN)
        .set("Cookie", "refresh_token=x");

    assert.equal(res.status, 401);
    assert.deepEqual(res.body, { mensaje: "Sesion expirada" });
});

test("POST /refresh con Origin no permitido -> 403 (verificacion CSRF)", async () => {
    const res = await request(app)
        .post("/api/auth/refresh")
        .set("Origin", "http://evil.com")
        .set("Cookie", "refresh_token=x");

    assert.equal(res.status, 403);
    assert.deepEqual(res.body, { mensaje: "Origen no permitido" });
});

test("POST /refresh sin Origin ni Referer -> 403", async () => {
    const res = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", "refresh_token=x");

    assert.equal(res.status, 403);
    assert.deepEqual(res.body, { mensaje: "Origen no permitido" });
});

test("POST /logout responde 200 { mensaje } y borra la cookie", async () => {
    const res = await request(app)
        .post("/api/auth/logout")
        .set("Origin", ORIGEN)
        .set("Cookie", "refresh_token=x");

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { mensaje: "Sesión cerrada" });
    const setCookie = res.headers["set-cookie"][0];
    // clearCookie borra la cookie (Max-Age=0 o Expires en el pasado).
    assert.match(setCookie, /^refresh_token=/);
    assert.ok(/Max-Age=0/i.test(setCookie) || /Expires=/i.test(setCookie));
    assert.match(setCookie, /Path=\/api\/auth/i);
});

test("POST /logout con Origin no permitido -> 403", async () => {
    const res = await request(app)
        .post("/api/auth/logout")
        .set("Origin", "http://evil.com")
        .set("Cookie", "refresh_token=x");

    assert.equal(res.status, 403);
});

test("POST /logout es idempotente: sin cookie responde 200 igual", async () => {
    const res = await request(app)
        .post("/api/auth/logout")
        .set("Origin", ORIGEN);

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { mensaje: "Sesión cerrada" });
});
