// Limitadores de /api/auth sobre la app real. Archivo aparte del resto de los
// tests de rate limit porque necesita un tope general ALTO: los cupos de login
// (10) y auth (30) solo se pueden observar si el general no salta antes.
//
// Existe por una razon concreta: estos dos limitadores se reescribieron para
// responder con `handler` en vez de la opcion `message`, y sus textos son
// contrato publico (§2.4). Un cambio de mensaje o de status aqui rompe al SPA.
const { test, before, beforeEach } = require("node:test");
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

// Muy por encima de los topes de auth, para que el general no interfiera.
process.env.RATE_LIMIT_GENERAL_MAX = "500";

const request = require("supertest");

const cadena = [
    "../../middleware/limitadores",
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
        MENSAJE_SESION_EXPIRADA: "Sesion expirada",
        login: async () => {
            throw new ErrorNoAutorizado("Correo o contraseña incorrectos");
        },
        refresh: async () => {
            throw new ErrorNoAutorizado("Sesion expirada");
        },
        logout: async () => {}
    };
    app = cargarApp();
});

test("login: al intento 11 responde 429 con el mensaje del contrato", async () => {
    let ultima;

    // Los 10 primeros llegan al service (401 de credenciales).
    for (let i = 0; i < 10; i++) {
        ultima = await request(app)
            .post("/api/auth/login")
            .send({ correo: "a@x.co", password: "mala" });
        assert.equal(ultima.status, 401, `intento ${i + 1} deberia ser 401`);
    }

    const bloqueada = await request(app)
        .post("/api/auth/login")
        .send({ correo: "a@x.co", password: "mala" });

    assert.equal(bloqueada.status, 429);
    assert.deepEqual(bloqueada.body, {
        mensaje:
            "Demasiados intentos de inicio de sesión. Intenta de nuevo más tarde."
    });
});

test("el cupo de login NO se gasta con peticiones a otros endpoints", async () => {
    // Cada capa lleva su propio contador: navegar por la API no debe acercar a
    // nadie al bloqueo de login.
    for (let i = 0; i < 20; i++) {
        await request(app).get("/");
    }

    const login = await request(app)
        .post("/api/auth/login")
        .send({ correo: "a@x.co", password: "mala" });

    assert.equal(login.status, 401);
});

test("refresh y logout comparten un cupo de 30 y devuelven su propio mensaje", async () => {
    // Ambos cuelgan del MISMO limitador: 20 refresh + 10 logout agotan los 30.
    for (let i = 0; i < 20; i++) {
        await request(app)
            .post("/api/auth/refresh")
            .set("Origin", process.env.CORS_ORIGIN);
    }
    for (let i = 0; i < 10; i++) {
        await request(app)
            .post("/api/auth/logout")
            .set("Origin", process.env.CORS_ORIGIN);
    }

    const bloqueada = await request(app)
        .post("/api/auth/refresh")
        .set("Origin", process.env.CORS_ORIGIN);

    assert.equal(bloqueada.status, 429);
    assert.deepEqual(bloqueada.body, {
        mensaje:
            "Demasiadas solicitudes de autenticación. Intenta de nuevo más tarde."
    });
});

test("el cupo de auth es independiente del de login", async () => {
    // Agotar refresh/logout no debe dejar a nadie sin poder intentar entrar.
    for (let i = 0; i < 31; i++) {
        await request(app)
            .post("/api/auth/refresh")
            .set("Origin", process.env.CORS_ORIGIN);
    }

    const login = await request(app)
        .post("/api/auth/login")
        .send({ correo: "a@x.co", password: "mala" });

    assert.equal(login.status, 401);
});
