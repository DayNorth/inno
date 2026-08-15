// Punto de entrada del proceso: importa la app ya cableada y abre el puerto.
// Separado de app.js para poder testear la aplicación con supertest sin abrir
// un socket real. El logger pino reemplaza el console.log de arranque.
const config = require("./config/env");
const app = require("./app");
const logger = require("./logger");

const server = app.listen(config.PORT, () => {
    logger.info(
        { puerto: config.PORT },
        `Servidor ejecutándose en http://localhost:${config.PORT}`
    );
});

// Apagado ordenado: cierra el servidor HTTP al recibir señales de terminación.
function apagar(senal) {
    logger.info({ senal }, "Cerrando el servidor de forma ordenada");
    server.close(() => {
        logger.info("Servidor cerrado");
        process.exit(0);
    });
}

process.on("SIGTERM", () => apagar("SIGTERM"));
process.on("SIGINT", () => apagar("SIGINT"));
