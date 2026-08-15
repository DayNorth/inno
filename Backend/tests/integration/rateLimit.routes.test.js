// Tests del limitador de tasa sobre la app real. Van en su propio archivo
// porque fijan topes minusculos por variable de entorno: node:test corre cada
// archivo en un proceso aparte, asi que estos limites no contaminan al resto de
// la suite (donde el tope por defecto de 300 no estorba).
//
// Lo que se comprueba es lo que se rompe en silencio: que el limite cubre
// TODOS los endpoints (incluidos los publicos y el 404) y no solo los de auth,
// que el 429 sale con el sobre { mensaje } de la API y no con el HTML por
// defecto de express-rate-limit, y que los cupos de cada capa son
// independientes entre si.
const { test, before, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { fijarEnvDePrueba } = require("../helpers/env");
const {
    mockModule,
    limpiarCache,
    crearLoggerSilencioso
} = require("../helpers/mockModule");

fijarEnvDePrueba();

// ANTES de cargar config/env (lo hace app al importarse).
process.env.RATE_LIMIT_GENERAL_MAX = "3";
process.env.RATE_LIMIT_SUBIDA_MAX = "2";

const jwt = require("jsonwebtoken");
const request = require("supertest");

function bearer(token) {
    return "Bearer " + token;
}

function token(id_rol = 1, id_usuario = 42) {
    return jwt.sign(
        { id_usuario, correo: "u@x.co", id_rol, rol: "R" },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
    );
}

// La app y los limitadores se recargan juntos: los contadores viven en el
// limitador, no en la app, asi que sin limpiar limitadores el cupo se arrastra
// de un test al siguiente.
const cadena = [
    "../../middleware/limitadores",
    "../../services/clientes.service",
    "../../controllers/clientes.controller",
    "../../routes/clientes",
    "../../app"
];

let app;

function cargarApp() {
    limpiarCache(...cadena);
    mockModule("../../services/clientes.service", {
        listarActivos: async () => [],
        listarTodos: async () => [],
        obtenerPorId: async () => ({ id_cliente: 1 }),
        crear: async () => ({ id_cliente: 1 }),
        actualizar: async () => ({ id_cliente: 1 }),
        inactivar: async () => ({ id_cliente: 1 }),
        reactivar: async () => ({ id_cliente: 1 })
    });
    return require(path.resolve(__dirname, "../../app"));
}

before(() => {
    mockModule("../../db", { poolPromise: Promise.resolve({}), sql: {} });
    mockModule("../../logger", crearLoggerSilencioso());
});

beforeEach(() => {
    app = cargarApp();
});

test("el limite general cubre un endpoint de negocio autenticado", async () => {
    const auth = bearer(token());

    for (let i = 0; i < 3; i++) {
        const ok = await request(app)
            .get("/api/clientes")
            .set("Authorization", auth);
        assert.equal(ok.status, 200, `peticion ${i + 1} deberia pasar`);
    }

    const bloqueada = await request(app)
        .get("/api/clientes")
        .set("Authorization", auth);

    assert.equal(bloqueada.status, 429);
    // Sobre { mensaje } de la API, no el "Too many requests" en texto plano que
    // trae express-rate-limit por defecto: el SPA solo sabe leer este.
    assert.deepEqual(bloqueada.body, {
        mensaje: "Demasiadas peticiones. Intenta de nuevo más tarde."
    });
});

test("el limite general tambien cubre la raiz publica", async () => {
    for (let i = 0; i < 3; i++) {
        const ok = await request(app).get("/");
        assert.equal(ok.status, 200);
    }

    const bloqueada = await request(app).get("/");
    assert.equal(bloqueada.status, 429);
});

test("el limite general tambien cubre las rutas inexistentes (404)", async () => {
    // Si el limitador colgara de cada router, una ruta no montada consumiria
    // recursos sin tope: se monta antes que todo justamente por esto.
    for (let i = 0; i < 3; i++) {
        const r = await request(app).get("/ruta/que/no/existe");
        assert.equal(r.status, 404);
    }

    const bloqueada = await request(app).get("/otra/ruta/inexistente");
    assert.equal(bloqueada.status, 429);
});

test("el limite general se aplica aun SIN token (antes de autenticar)", async () => {
    // Peticiones anonimas: el 401 tambien cuesta trabajo al servidor, asi que
    // tambien consume cupo. Si no, el limite seria trivial de esquivar.
    for (let i = 0; i < 3; i++) {
        const r = await request(app).get("/api/clientes");
        assert.equal(r.status, 401);
    }

    const bloqueada = await request(app).get("/api/clientes");
    assert.equal(bloqueada.status, 429);
});

test("el 429 llega con las cabeceras estandar de RateLimit", async () => {
    const auth = bearer(token());
    let ultima;

    for (let i = 0; i < 4; i++) {
        ultima = await request(app)
            .get("/api/clientes")
            .set("Authorization", auth);
    }

    assert.equal(ultima.status, 429);
    // standardHeaders: el cliente puede saber cuando reintentar sin adivinar.
    assert.ok(
        ultima.headers["ratelimit"] || ultima.headers["ratelimit-limit"],
        "falta la cabecera RateLimit estandar"
    );
    assert.equal(ultima.headers["x-ratelimit-limit"], undefined);
});

test("el 429 sale con cabeceras CORS (si no, el navegador oculta la causa)", async () => {
    const auth = bearer(token());
    let ultima;

    for (let i = 0; i < 4; i++) {
        ultima = await request(app)
            .get("/api/clientes")
            .set("Authorization", auth)
            .set("Origin", process.env.CORS_ORIGIN);
    }

    assert.equal(ultima.status, 429);
    // El limitador va DESPUES de cors() a proposito: sin este header el fetch
    // del SPA falla por CORS y el usuario nunca ve el mensaje del 429.
    assert.equal(
        ultima.headers["access-control-allow-origin"],
        process.env.CORS_ORIGIN
    );
});

test("el limite de subida es independiente del general y cuenta por usuario", async () => {
    // Tope de subida (2) por debajo del general (3): la tercera subida se corta
    // por el limitador de subida, no por el general.
    const auth = bearer(token(1, 500));

    const primera = await request(app)
        .post("/api/documentos")
        .set("Authorization", auth);
    // Sin archivo adjunto el service responde 400; da igual, lo que importa es
    // que la peticion CONSUMIO cupo de subida.
    assert.notEqual(primera.status, 429);

    const segunda = await request(app)
        .post("/api/documentos")
        .set("Authorization", auth);
    assert.notEqual(segunda.status, 429);

    const tercera = await request(app)
        .post("/api/documentos")
        .set("Authorization", auth);

    assert.equal(tercera.status, 429);
    assert.deepEqual(tercera.body, {
        mensaje: "Demasiadas subidas de archivos. Intenta de nuevo más tarde."
    });
});

test("el cupo de subida NO se comparte entre usuarios distintos", async () => {
    // Cuenta por usuario, no por IP: en supertest ambos vienen de 127.0.0.1, asi
    // que si se contara por IP el segundo usuario heredaria el cupo gastado.
    for (let i = 0; i < 2; i++) {
        await request(app)
            .post("/api/documentos")
            .set("Authorization", bearer(token(1, 601)));
    }

    const otroUsuario = await request(app)
        .post("/api/documentos")
        .set("Authorization", bearer(token(1, 602)));

    assert.notEqual(otroUsuario.status, 429);
});

test("un 403 por rol NO consume cupo de subida", async () => {
    // El auditor rebota en requerirRol, que va antes del limitador: su intento
    // no puede gastar el cupo de quienes si pueden subir.
    for (let i = 0; i < 3; i++) {
        const r = await request(app)
            .post("/api/documentos")
            .set("Authorization", bearer(token(3, 700)));
        assert.equal(r.status, 403);
    }
});
