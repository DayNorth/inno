// Inyecta un módulo falso en la caché de require de Node, de modo que cualquier
// require posterior de esa ruta reciba el doble de prueba. Se usa para aislar
// los services y la app de la BD real (db, logger) sin frameworks de mock.
//
// Uso:
//   mockModule("../../db", { poolPromise: Promise.resolve({}), sql: {} });
const path = require("path");
const Module = require("module");
const pino = require("pino");

function mockModule(especificador, exportsFalsos) {
    const rutaAbsoluta = require.resolve(
        path.resolve(__dirname, especificador)
    );
    const falso = new Module(rutaAbsoluta);
    falso.filename = rutaAbsoluta;
    falso.loaded = true;
    falso.exports = exportsFalsos;
    require.cache[rutaAbsoluta] = falso;
    return rutaAbsoluta;
}

function limpiarCache(...especificadores) {
    for (const esp of especificadores) {
        const ruta = require.resolve(path.resolve(__dirname, esp));
        delete require.cache[ruta];
    }
}

// Logger pino REAL en nivel "silent": compatible con pino-http (expone los
// símbolos internos y .child() que pino-http necesita) pero no imprime nada,
// manteniendo la salida de test limpia. Un objeto casero no basta porque
// pino-http lee internals de pino.
function crearLoggerSilencioso() {
    return pino({ level: "silent" });
}

module.exports = { mockModule, limpiarCache, crearLoggerSilencioso };
