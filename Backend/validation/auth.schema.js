// Esquema de validacion del login. Preserva el 400 del legacy: si falta correo
// o password (o vienen vacios), el mensaje es EXACTAMENTE "Correo y contraseña
// son obligatorios". El correo se normaliza con trim (el legacy hacia
// correo.trim() antes del lookup). El password no se transforma.
const { z } = require("zod");

const MENSAJE_OBLIGATORIO = "Correo y contraseña son obligatorios";

// Usuarios.correo es varchar(100): un correo sobredimensionado revienta el
// bind del driver antes de llegar a bcrypt.compare. Se reutiliza el MISMO
// mensaje genérico (no uno de "correo demasiado largo") a propósito: el
// contrato de login nunca distingue qué campo/motivo falló.
const loginSchema = z.object({
    correo: z
        .string({ message: MENSAJE_OBLIGATORIO })
        .trim()
        .min(1, MENSAJE_OBLIGATORIO)
        .max(100, MENSAJE_OBLIGATORIO),
    password: z
        .string({ message: MENSAJE_OBLIGATORIO })
        .min(1, MENSAJE_OBLIGATORIO)
});

module.exports = { loginSchema, MENSAJE_OBLIGATORIO };
