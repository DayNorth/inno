// Tests del auth.service con repos y BD mockeados (sin SQL real). Verifican las
// 4 decisiones del gate: login emite familia nueva y devuelve el refresh EN
// CLARO al controller (nunca en el retorno como "body"); refresh rota de forma
// atomica y devuelve un access nuevo con un refresh nuevo distinto; deteccion de
// reuso revoca la familia y lanza 401 neutro + Bitacora; logout revoca la
// familia de forma idempotente; 401 neutro sin distinguir el motivo. Usa los
// helpers reales de refreshToken (HMAC con la pepper de prueba).
const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const jwt = require("jsonwebtoken");
const { fijarEnvDePrueba } = require("../helpers/env");
const { mockModule, limpiarCache } = require("../helpers/mockModule");

fijarEnvDePrueba();

// Hash bcrypt de la contrasena "secreta" (generado con bcryptjs, coste 10).
const HASH_SECRETA =
    "$2b$10$miv6xaNhBz0z6c3qnpsJBOZIKLb.yRK60Y3LvlBtj78dub9elfj.2";

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

function cargarService() {
    const ruta = require.resolve(
        path.resolve(__dirname, "../../services/auth.service")
    );
    delete require.cache[ruta];
    return require(ruta);
}

let ev;
let usuariosMock;
let refreshMock;
let bitacoraMock;
let logsWarn;
let servicio;

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

    usuariosMock = {
        listarActivos: async () => [],
        buscarPorCorreoParaLogin: async () => ({
            id_usuario: 7,
            nombre: "Admin",
            correo: "admin@x.co",
            password: HASH_SECRETA,
            id_rol: 1,
            estado: "Activo",
            rol: "Administrador",
            mfa_activado: false,
            intentos_fallidos: 0
        }),
        buscarPorIdParaToken: async () => ({
            id_usuario: 7,
            nombre: "Admin",
            correo: "admin@x.co",
            id_rol: 1,
            estado: "Activo",
            rol: "Administrador"
        }),
        incrementarIntentosFallidos: async () => {},
        registrarLoginExitoso: async () => {},
        resetearIntentosFallidos: async () => ({
            id_usuario: 7,
            nombre: "Admin",
            intentos_fallidos: 0
        })
    };

    refreshMock = {
        insertar: async () => 100,
        buscarPorHash: async () => null,
        rotar: async () => 1,
        revocarFamilia: async () => 1
    };

    bitacoraMock = { registrar: async () => {}, listar: async () => [] };

    mockModule("../../repositories/usuarios.repository", usuariosMock);
    mockModule("../../repositories/refreshTokens.repository", refreshMock);
    mockModule("../../repositories/bitacora.repository", bitacoraMock);

    servicio = cargarService();
});

afterEach(() => {
    limpiarCache(
        "../../db",
        "../../logger",
        "../../utils/transacciones",
        "../../repositories/usuarios.repository",
        "../../repositories/refreshTokens.repository",
        "../../repositories/bitacora.repository",
        "../../services/auth.service"
    );
});

test("login: credenciales validas emiten familia, refresh en claro y access", async () => {
    let idFamiliaInsertada;
    let accionBitacora;
    refreshMock.insertar = async (_tx, datos) => {
        idFamiliaInsertada = datos.idFamilia;
        return 100;
    };
    bitacoraMock.registrar = async (_tx, _id, a) => {
        accionBitacora = a;
    };
    servicio = cargarService();

    const r = await servicio.login({
        correo: "admin@x.co",
        password: "secreta"
    });

    // El access va como token; el refresh en claro se devuelve para la cookie.
    assert.ok(typeof r.accessToken === "string" && r.accessToken.length > 20);
    assert.ok(
        typeof r.refreshTokenClaro === "string" &&
            r.refreshTokenClaro.length === 43
    );
    // Proyeccion publica sin password.
    assert.equal(r.usuario.id_usuario, 7);
    assert.equal(r.usuario.password, undefined);
    // Familia nueva (uniqueidentifier) emitida por login.
    assert.match(
        idFamiliaInsertada,
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
    assert.equal(accionBitacora, "Inicio de sesión exitoso");
    assert.equal(ev.commits, 1);
    assert.equal(ev.rollbacks, 0);
});

test("login: usuario inexistente -> 401 neutro (no distingue)", async () => {
    usuariosMock.buscarPorCorreoParaLogin = async () => null;
    servicio = cargarService();

    await assert.rejects(
        () => servicio.login({ correo: "x@x.co", password: "secreta" }),
        (e) => {
            assert.equal(e.status, 401);
            assert.equal(e.message, "Correo o contraseña incorrectos");
            return true;
        }
    );
});

test("login: usuario inactivo -> 403", async () => {
    usuariosMock.buscarPorCorreoParaLogin = async () => ({
        id_usuario: 7,
        correo: "admin@x.co",
        password: HASH_SECRETA,
        id_rol: 1,
        estado: "Inactivo",
        rol: "Administrador"
    });
    servicio = cargarService();

    await assert.rejects(
        () => servicio.login({ correo: "admin@x.co", password: "secreta" }),
        (e) => {
            assert.equal(e.status, 403);
            assert.equal(e.message, "El usuario está inactivo");
            return true;
        }
    );
});

test("login: password incorrecta -> 401 neutro", async () => {
    servicio = cargarService();

    await assert.rejects(
        () => servicio.login({ correo: "admin@x.co", password: "mala" }),
        (e) => {
            assert.equal(e.status, 401);
            assert.equal(e.message, "Correo o contraseña incorrectos");
            return true;
        }
    );
});

// Fila tal como la devuelve buscarPorHash: SOLO columnas de RefreshTokens. No
// lleva correo/id_rol/rol a proposito — inventarlas aqui es lo que escondia que
// el refresh firmaba un access sin rol (jwt.sign descarta las claims undefined).
function filaVigente(extra) {
    return {
        id_refresh_token: 50,
        id_familia: "11111111-1111-1111-1111-111111111111",
        id_usuario: 7,
        fecha_expiracion: new Date(Date.now() + 60 * 60 * 1000),
        revocado: false,
        reemplazado_por: null,
        ...extra
    };
}

test("refresh: sin cookie -> 401 neutro", async () => {
    await assert.rejects(
        () => servicio.refresh(undefined),
        (e) => {
            assert.equal(e.status, 401);
            assert.equal(e.message, "Sesion expirada");
            return true;
        }
    );
});

test("refresh: token inexistente -> 401 neutro", async () => {
    refreshMock.buscarPorHash = async () => null;
    servicio = cargarService();

    await assert.rejects(
        () => servicio.refresh("cualquier-token"),
        (e) => {
            assert.equal(e.status, 401);
            assert.equal(e.message, "Sesion expirada");
            return true;
        }
    );
});

test("refresh: token vigente rota atomicamente y devuelve access + refresh nuevo", async () => {
    let insertLlamado = false;
    let rotarArgs;
    refreshMock.buscarPorHash = async () => filaVigente();
    refreshMock.insertar = async () => {
        insertLlamado = true;
        return 51;
    };
    refreshMock.rotar = async (_tx, args) => {
        rotarArgs = args;
        return 1;
    };
    servicio = cargarService();

    const entrante = "token-viejo-en-claro";
    const r = await servicio.refresh(entrante);

    assert.ok(typeof r.accessToken === "string" && r.accessToken.length > 20);
    // El refresh nuevo es distinto del entrante y NO aparece ningun otro campo
    // (el retorno no lleva "body"; el refresh va solo por la cookie via controller).
    assert.equal(r.refreshTokenClaro.length, 43);
    assert.notEqual(r.refreshTokenClaro, entrante);
    assert.ok(insertLlamado);
    // Rotacion apunta la fila vieja al id del hijo insertado.
    assert.equal(rotarArgs.idRefreshToken, 50);
    assert.equal(rotarArgs.idReemplazo, 51);
    assert.equal(ev.commits, 1);
});

test("refresh: el access nuevo lleva las mismas claims que el de login", async () => {
    refreshMock.buscarPorHash = async () => filaVigente();
    servicio = cargarService();

    const r = await servicio.refresh("token-viejo-en-claro");
    const payload = jwt.verify(r.accessToken, process.env.JWT_SECRET);

    // Sin estas claims, requerirRol(...) da 403 a todo despues del primer
    // refresh, incluso siendo Administrador.
    assert.equal(payload.id_usuario, 7);
    assert.equal(payload.correo, "admin@x.co");
    assert.equal(payload.id_rol, 1);
    assert.equal(payload.rol, "Administrador");
});

test("refresh: el rol se relee de Usuarios, no de la fila del token", async () => {
    // Rol cambiado despues de emitir el refresh: el access nuevo debe reflejarlo.
    refreshMock.buscarPorHash = async () => filaVigente();
    usuariosMock.buscarPorIdParaToken = async () => ({
        id_usuario: 7,
        nombre: "Admin",
        correo: "admin@x.co",
        id_rol: 3,
        estado: "Activo",
        rol: "Operador"
    });
    servicio = cargarService();

    const r = await servicio.refresh("token-viejo-en-claro");
    const payload = jwt.verify(r.accessToken, process.env.JWT_SECRET);

    assert.equal(payload.id_rol, 3);
    assert.equal(payload.rol, "Operador");
});

test("refresh: usuario inactivado tras el login -> 401 neutro y no rota", async () => {
    let rotado = false;
    refreshMock.buscarPorHash = async () => filaVigente();
    refreshMock.rotar = async () => {
        rotado = true;
        return 1;
    };
    usuariosMock.buscarPorIdParaToken = async () => ({
        id_usuario: 7,
        correo: "admin@x.co",
        id_rol: 1,
        estado: "Inactivo",
        rol: "Administrador"
    });
    servicio = cargarService();

    await assert.rejects(
        () => servicio.refresh("token-de-usuario-inactivo"),
        (e) => {
            assert.equal(e.status, 401);
            assert.equal(e.message, "Sesion expirada");
            return true;
        }
    );
    // No quema el token vigente por una cuenta que ya no puede usarlo.
    assert.equal(rotado, false);
});

test("refresh: usuario borrado -> 401 neutro", async () => {
    refreshMock.buscarPorHash = async () => filaVigente();
    usuariosMock.buscarPorIdParaToken = async () => null;
    servicio = cargarService();

    await assert.rejects(
        () => servicio.refresh("token-de-usuario-borrado"),
        (e) => {
            assert.equal(e.status, 401);
            assert.equal(e.message, "Sesion expirada");
            return true;
        }
    );
});

test("refresh: reuso (fila ya revocada) -> revoca familia + Bitacora + 401 + warn", async () => {
    let revocarArgs;
    let accionBitacora;
    refreshMock.buscarPorHash = async () => filaVigente({ revocado: true });
    refreshMock.revocarFamilia = async (_tx, args) => {
        revocarArgs = args;
        return 2;
    };
    bitacoraMock.registrar = async (_tx, _id, a) => {
        accionBitacora = a;
    };
    servicio = cargarService();

    await assert.rejects(
        () => servicio.refresh("token-reusado"),
        (e) => {
            assert.equal(e.status, 401);
            assert.equal(e.message, "Sesion expirada");
            return true;
        }
    );

    assert.equal(revocarArgs.motivo, "reuso_detectado");
    assert.equal(revocarArgs.idFamilia, "11111111-1111-1111-1111-111111111111");
    assert.equal(
        accionBitacora,
        "Posible reuso de refresh token detectado; sesión revocada"
    );
    // Log de seguridad con warn, SIN token ni hash.
    assert.equal(logsWarn.length, 1);
    assert.equal(logsWarn[0].obj.motivo, "reuso_detectado");
    assert.equal(logsWarn[0].obj.id_familia, revocarArgs.idFamilia);
    const serializado = JSON.stringify(logsWarn[0]);
    assert.ok(!serializado.includes("token-reusado"));
});

test("refresh: reuso (ya rotado, reemplazado_por) -> revoca familia y 401", async () => {
    let revocarArgs;
    refreshMock.buscarPorHash = async () =>
        filaVigente({ reemplazado_por: 99 });
    refreshMock.revocarFamilia = async (_tx, args) => {
        revocarArgs = args;
        return 1;
    };
    servicio = cargarService();

    await assert.rejects(
        () => servicio.refresh("token-rotado-reusado"),
        (e) => {
            assert.equal(e.status, 401);
            return true;
        }
    );
    assert.equal(revocarArgs.motivo, "reuso_detectado");
});

test("refresh: token expirado -> 401 neutro (sin revocar familia)", async () => {
    let revocado = false;
    refreshMock.buscarPorHash = async () =>
        filaVigente({
            fecha_expiracion: new Date(Date.now() - 1000)
        });
    refreshMock.revocarFamilia = async () => {
        revocado = true;
        return 1;
    };
    servicio = cargarService();

    await assert.rejects(
        () => servicio.refresh("token-expirado"),
        (e) => {
            assert.equal(e.status, 401);
            assert.equal(e.message, "Sesion expirada");
            return true;
        }
    );
    // Expiracion no es reuso: no revoca la familia.
    assert.equal(revocado, false);
});

test("refresh: carrera benigna (rotar afecta 0 filas) -> 401 neutro y rollback", async () => {
    refreshMock.buscarPorHash = async () => filaVigente();
    refreshMock.insertar = async () => 51;
    refreshMock.rotar = async () => 0;
    servicio = cargarService();

    await assert.rejects(
        () => servicio.refresh("token-en-carrera"),
        (e) => {
            assert.equal(e.status, 401);
            assert.equal(e.message, "Sesion expirada");
            return true;
        }
    );
    assert.equal(ev.rollbacks, 1);
    assert.equal(ev.commits, 0);
});

test("logout: revoca la familia con motivo logout + Bitacora y commitea", async () => {
    let revocarArgs;
    let accionBitacora;
    refreshMock.buscarPorHash = async () => filaVigente();
    refreshMock.revocarFamilia = async (_tx, args) => {
        revocarArgs = args;
        return 1;
    };
    bitacoraMock.registrar = async (_tx, _id, a) => {
        accionBitacora = a;
    };
    servicio = cargarService();

    await servicio.logout("token-a-cerrar");

    assert.equal(revocarArgs.motivo, "logout");
    assert.equal(accionBitacora, "Cierre de sesión");
    assert.equal(ev.commits, 1);
});

test("logout: sin cookie -> no-op idempotente (no lanza, no toca BD)", async () => {
    let tocada = false;
    refreshMock.buscarPorHash = async () => {
        tocada = true;
        return null;
    };
    servicio = cargarService();

    await servicio.logout(undefined);
    assert.equal(tocada, false);
    assert.equal(ev.commits, 0);
});

test("logout: token inexistente -> idempotente, no falla", async () => {
    refreshMock.buscarPorHash = async () => null;
    servicio = cargarService();

    await servicio.logout("token-que-no-existe");
    assert.equal(ev.commits, 0);
});

test("logout: familia ya revocada (0 filas) -> no audita pero commitea", async () => {
    let auditado = false;
    refreshMock.buscarPorHash = async () => filaVigente();
    refreshMock.revocarFamilia = async () => 0;
    bitacoraMock.registrar = async () => {
        auditado = true;
    };
    servicio = cargarService();

    await servicio.logout("token-ya-cerrado");
    assert.equal(auditado, false);
    assert.equal(ev.commits, 1);
});
