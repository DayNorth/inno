// Validación de variables de entorno con zod (fail fast).
// Se valida AL IMPORTAR: si falta o es inválida una variable, el proceso
// termina antes de abrir el puerto. El resto de la app importa este módulo
// (config tipada), nunca process.env disperso.
const { z } = require("zod");

require("dotenv").config();

const esquemaEnv = z
    .object({
        DB_SERVER: z.string().min(1),
        DB_PORT: z.coerce.number().int().positive().default(1433),
        DB_DATABASE: z.string().min(1),
        DB_USER: z.string().min(1),
        DB_PASSWORD: z.string().min(1),
        DB_TRUST_SERVER_CERTIFICATE: z
            .enum(["true", "false"])
            .default("false"),

        PORT: z.coerce.number().int().positive().default(3001),
        NODE_ENV: z
            .enum(["development", "test", "production"])
            .default("development"),

        // Secreto del access token. Se admite JWT_SECRET (histórico) o
        // JWT_ACCESS_SECRET; se normaliza a JWT_SECRET más abajo.
        JWT_SECRET: z.string().min(32).optional(),
        JWT_ACCESS_SECRET: z.string().min(32).optional(),
        // Secreto DISTINTO para el refresh (nunca reutilizar el de access).
        JWT_REFRESH_SECRET: z
            .string()
            .min(32, "JWT_REFRESH_SECRET debe tener al menos 32 caracteres"),
        // Pepper del HMAC del refresh token. Secreto DISTINTO de los anteriores.
        REFRESH_TOKEN_PEPPER: z
            .string()
            .min(32, "REFRESH_TOKEN_PEPPER debe tener al menos 32 caracteres"),

        JWT_ACCESS_TTL: z.string().default("15m"),
        JWT_REFRESH_TTL: z.string().default("7d"),
        // Vida del refresh en días, usada para calcular fecha_expiracion y Max-Age.
        JWT_REFRESH_TTL_DIAS: z.coerce.number().int().positive().default(7),

        CORS_ORIGIN: z.string().default("http://localhost:5173"),

        // Carpeta de archivos subidos (Documentos), relativa a Backend/ salvo
        // que se dé una ruta absoluta. Configurable para que los tests escriban
        // en un directorio temporal y no en el del proyecto.
        UPLOAD_DIR: z.string().min(1).default("uploads"),
        // Tope duro de tamaño por archivo (bytes). Lo aplica multer ANTES de
        // escribir el archivo entero: sin él, un cliente puede llenar el disco.
        UPLOAD_MAX_BYTES: z.coerce
            .number()
            .int()
            .positive()
            .default(10 * 1024 * 1024),

        // Peticiones por IP y ventana de 15 min contra CUALQUIER endpoint. Alto
        // para no estorbar al SPA, que dispara varias por pantalla.
        RATE_LIMIT_GENERAL_MAX: z.coerce.number().int().positive().default(300),
        // Subidas de archivo por usuario y ventana: el endpoint más caro.
        RATE_LIMIT_SUBIDA_MAX: z.coerce.number().int().positive().default(20)
    })
    // Debe existir al menos uno de los dos secretos de access.
    .refine((env) => env.JWT_SECRET || env.JWT_ACCESS_SECRET, {
        message: "Debe definirse JWT_SECRET o JWT_ACCESS_SECRET (mínimo 32 caracteres)",
        path: ["JWT_SECRET"]
    })
    // Los tres secretos deben ser DISTINTOS entre sí (F-10).
    .superRefine((env, ctx) => {
        const accessSecret = env.JWT_SECRET || env.JWT_ACCESS_SECRET;
        const secretos = {
            access: accessSecret,
            refresh: env.JWT_REFRESH_SECRET,
            pepper: env.REFRESH_TOKEN_PEPPER
        };

        if (secretos.access === secretos.refresh) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    "JWT_SECRET/JWT_ACCESS_SECRET y JWT_REFRESH_SECRET deben ser distintos",
                path: ["JWT_REFRESH_SECRET"]
            });
        }
        if (secretos.access === secretos.pepper) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    "REFRESH_TOKEN_PEPPER debe ser distinto de JWT_SECRET/JWT_ACCESS_SECRET",
                path: ["REFRESH_TOKEN_PEPPER"]
            });
        }
        if (secretos.refresh === secretos.pepper) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    "REFRESH_TOKEN_PEPPER debe ser distinto de JWT_REFRESH_SECRET",
                path: ["REFRESH_TOKEN_PEPPER"]
            });
        }
    });

const parsed = esquemaEnv.safeParse(process.env);

if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error(
        "Configuración de entorno inválida:",
        parsed.error.flatten().fieldErrors
    );
    process.exit(1);
}

const datos = parsed.data;

// Secreto de access normalizado a un único nombre para el resto de la app.
const jwtAccessSecret = datos.JWT_SECRET || datos.JWT_ACCESS_SECRET;

const config = {
    ...datos,
    JWT_SECRET: jwtAccessSecret,
    JWT_ACCESS_SECRET: jwtAccessSecret,
    esProduccion: datos.NODE_ENV === "production"
};

module.exports = config;
