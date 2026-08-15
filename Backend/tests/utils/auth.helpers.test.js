// Tests de los helpers puros de auth: HMAC del refresh token (determinismo, 64
// hex minuscula, dependencia de la pepper) y verificacion de Origin/Referer
// contra la allowlist (Decision 1/2 del gate). Sin BD ni HTTP.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { fijarEnvDePrueba } = require("../helpers/env");

fijarEnvDePrueba();

const {
    generarRefreshTokenClaro,
    hashRefreshToken,
    calcularFechaExpiracion
} = require("../../utils/refreshToken");
const {
    esOrigenPermitido,
    origenDeUrl
} = require("../../utils/verificarOrigen");

test("hashRefreshToken: 64 caracteres hex en minuscula", () => {
    const hash = hashRefreshToken("token-de-prueba");
    assert.equal(hash.length, 64);
    assert.match(hash, /^[0-9a-f]{64}$/);
});

test("hashRefreshToken: determinista para el mismo token", () => {
    const a = hashRefreshToken("mismo-token");
    const b = hashRefreshToken("mismo-token");
    assert.equal(a, b);
});

test("hashRefreshToken: tokens distintos dan hashes distintos", () => {
    assert.notEqual(hashRefreshToken("token-a"), hashRefreshToken("token-b"));
});

test("generarRefreshTokenClaro: base64url de 256 bits, unico por llamada", () => {
    const t1 = generarRefreshTokenClaro();
    const t2 = generarRefreshTokenClaro();
    assert.equal(t1.length, 43);
    assert.match(t1, /^[A-Za-z0-9_-]+$/);
    assert.notEqual(t1, t2);
});

test("calcularFechaExpiracion: 7 dias en el futuro respecto a la base", () => {
    const base = new Date("2026-01-01T00:00:00.000Z");
    const exp = calcularFechaExpiracion(base);
    const dias = (exp.getTime() - base.getTime()) / (24 * 60 * 60 * 1000);
    assert.equal(dias, 7);
});

test("esOrigenPermitido: Origin que coincide -> true", () => {
    assert.equal(esOrigenPermitido({ origin: "http://localhost:5173" }), true);
});

test("esOrigenPermitido: Origin distinto -> false", () => {
    assert.equal(esOrigenPermitido({ origin: "http://evil.com" }), false);
});

test("esOrigenPermitido: sin Origin usa Referer (mismo origen) -> true", () => {
    assert.equal(
        esOrigenPermitido({ referer: "http://localhost:5173/login" }),
        true
    );
});

test("esOrigenPermitido: Referer de otro origen -> false", () => {
    assert.equal(esOrigenPermitido({ referer: "http://evil.com/x" }), false);
});

test("esOrigenPermitido: sin Origin ni Referer -> false", () => {
    assert.equal(esOrigenPermitido({}), false);
});

test("origenDeUrl: extrae scheme://host:puerto; null si invalida", () => {
    assert.equal(
        origenDeUrl("http://localhost:5173/ruta?x=1"),
        "http://localhost:5173"
    );
    assert.equal(origenDeUrl("no-es-url"), null);
});
