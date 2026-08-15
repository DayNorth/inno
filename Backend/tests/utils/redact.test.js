// Test de la configuracion de redact del logger (F-09): verifica que la cookie
// de refresh, el Set-Cookie, el Authorization Bearer, la pepper y los tokens
// NO aparecen en la salida del log; en su lugar queda el censor. Se instancia el
// logger real capturando su salida en un stream de memoria, evitando depender de
// pino-pretty (transport). Se fija NODE_ENV=test para que no use transport.
const { test, before } = require("node:test");
const assert = require("node:assert/strict");
const { Writable } = require("stream");
const pino = require("pino");
const { fijarEnvDePrueba } = require("../helpers/env");

fijarEnvDePrueba();

// Usa la lista real exportada por logger.js como fuente de verdad (sin
// duplicarla): si el baseline cambia, el test valida la lista vigente.
const { rutasRedactadas } = require("../../logger");

let salida;
let logger;

before(() => {
    salida = [];
    const destino = new Writable({
        write(chunk, _enc, cb) {
            salida.push(chunk.toString());
            cb();
        }
    });
    logger = pino(
        {
            level: "info",
            redact: { paths: rutasRedactadas, censor: "[REDACTADO]" }
        },
        destino
    );
});

test("la cookie de refresh no aparece en el log; queda censurada", () => {
    logger.info(
        {
            req: {
                headers: {
                    cookie: "refresh_token=SECRETO-QUE-NO-DEBE-SALIR",
                    authorization: "Bearer ACCESS-SECRETO"
                }
            },
            res: {
                headers: {
                    "set-cookie": ["refresh_token=OTRO-SECRETO; HttpOnly"]
                }
            }
        },
        "peticion de prueba"
    );

    const texto = salida.join("");
    assert.ok(!texto.includes("SECRETO-QUE-NO-DEBE-SALIR"));
    assert.ok(!texto.includes("ACCESS-SECRETO"));
    assert.ok(!texto.includes("OTRO-SECRETO"));
    assert.ok(texto.includes("[REDACTADO]"));
});

test("pepper y token en objetos anidados quedan censurados", () => {
    salida.length = 0;
    logger.info(
        {
            datos: {
                pepper: "PEPPER-SECRETA",
                token: "TOKEN-SECRETO",
                refreshToken: "REFRESH-SECRETO",
                token_hash: "HASH-SECRETO"
            }
        },
        "objeto con secretos"
    );

    const texto = salida.join("");
    assert.ok(!texto.includes("PEPPER-SECRETA"));
    assert.ok(!texto.includes("TOKEN-SECRETO"));
    assert.ok(!texto.includes("REFRESH-SECRETO"));
    assert.ok(!texto.includes("HASH-SECRETO"));
});
