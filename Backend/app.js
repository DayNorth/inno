// Bootstrap de la aplicación Express (sin abrir el puerto: eso lo hace
// server.js). Aquí se cablea la infraestructura transversal:
//  - config/env se importa PRIMERO (fail-fast): si falta o es inválida una
//    variable de entorno, el proceso termina antes de montar nada.
//  - requestLogger (pino-http) con correlation id, temprano en la cadena.
//  - cookie-parser para leer la cookie httpOnly del refresh token (Fase 4).
//  - helmet, cors, parsers de body.
//  - montaje de rutas (mismos prefijos y guardas que el legacy).
//  - errorHandler central como ÚLTIMO middleware (reemplaza el handler inline).
//
// Exporta `app` para poder testearla con supertest sin abrir un socket.

// Import temprano: valida el entorno y aborta si es inválido (fail-fast).
const config = require("./config/env");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

// Inicializa el pool mssql (singleton). Import con efecto lateral, igual que
// el legacy: la conexión se establece de forma perezosa vía poolPromise.
require("./db");

const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");
const { verificarToken, requerirRol } = require("./middleware/auth");
const {
    limitadorGeneral,
    limitadorLogin,
    limitadorAuth
} = require("./middleware/limitadores");

const bitacoraRoutes = require("./routes/bitacora");
const clientesRoutes = require("./routes/clientes");
const pedidosRoutes = require("./routes/pedidos");
const authRoutes = require("./routes/auth");
const productosRoutes = require("./routes/productos");
const accesosRoutes = require("./routes/accesos");
const dispositivosRoutes = require("./routes/dispositivos");
const riesgosRoutes = require("./routes/riesgos");
const incidentesRoutes = require("./routes/incidentes");
const proveedoresRoutes = require("./routes/proveedores");
const usuariosRoutes = require("./routes/usuarios");
const plataformasRoutes = require("./routes/plataformas");
const documentosRoutes = require("./routes/documentos");
const permisosRoutes = require("./routes/permisos");

const app = express();

// Logging estructurado con correlation id (x-request-id) por petición.
app.use(requestLogger);

app.use(helmet());

// CORS con origen explícito desde la configuración validada. `credentials`
// permite enviar la cookie httpOnly del refresh en los endpoints de auth
// (Fase 4). NUNCA "*" ni reflejo dinámico del Origin (F-02).
app.use(
    cors({
        origin: config.CORS_ORIGIN,
        credentials: true,
        allowedHeaders: [
            "Authorization",
            "Content-Type",
            "X-Request-Id",
            "X-Correlation-Id"
        ]
    })
);

// Límite de tasa BASE, aplicado a todo lo que venga después: rutas montadas,
// la raíz y hasta el 404. Se monta aquí, y no ruta por ruta, para que ningún
// endpoint futuro nazca sin límite por olvido.
//
// La posición no es casual. Va DESPUÉS de cors() para que el 429 llegue con las
// cabeceras CORS y el navegador muestre el mensaje real en vez de un error de
// CORS que oculta la causa; y ANTES de los parsers para no gastar CPU
// deserializando el cuerpo de una petición que ya está rechazada.
app.use(limitadorGeneral);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// NO se monta `express.static` sobre /uploads: serviría cada archivo subido a
// cualquiera que conociera su URL, sin token ni rol. Los documentos (facturas,
// DUAs, certificados) se descargan por GET /api/documentos/:id/descargar, que
// pasa por verificarToken como el resto de la API.

// Ruta pública de autenticación. Suma un límite más estrecho sobre el general
// (login por fuerza bruta; refresh/logout por abuso de rotación de sesión):
// ambos endpoints emiten credenciales y no se usan en ráfaga. Los topes y
// mensajes viven en middleware/limitadores.
app.use("/api/auth/login", limitadorLogin);
app.use("/api/auth/refresh", limitadorAuth);
app.use("/api/auth/logout", limitadorAuth);
app.use("/api/auth", authRoutes);

// Rutas protegidas: requieren un token de access válido.
app.use("/api/clientes", verificarToken, clientesRoutes);
app.use("/api/pedidos", verificarToken, pedidosRoutes);
app.use("/api/bitacora", verificarToken, requerirRol(1, 3), bitacoraRoutes);
app.use("/api/productos", verificarToken, productosRoutes);
app.use("/api/accesos", verificarToken, accesosRoutes);
app.use("/api/dispositivos", verificarToken, dispositivosRoutes);
app.use("/api/riesgos", verificarToken, riesgosRoutes);
app.use("/api/incidentes", verificarToken, incidentesRoutes);
app.use("/api/proveedores", verificarToken, proveedoresRoutes);
app.use("/api/usuarios", verificarToken, usuariosRoutes);
app.use("/api/plataformas", verificarToken, plataformasRoutes);
app.use("/api/documentos", verificarToken, documentosRoutes);
app.use("/api/permisos", verificarToken, permisosRoutes);
app.get("/", (req, res) => {
    res.status(200).json({
        mensaje: "API de Vinkaplant funcionando"
    });
});

// 404 para rutas no montadas (mismo sobre { mensaje } que el legacy).
app.use((req, res) => {
    res.status(404).json({
        mensaje: "Ruta no encontrada"
    });
});

// Error handler central: ÚNICO punto de mapeo de errores a HTTP. Debe ir al
// final, después de todas las rutas y del 404.
app.use(errorHandler);

module.exports = app;
