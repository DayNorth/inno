// Tests de los esquemas zod: aceptan válidos, rechazan inválidos con el mensaje
// EXACTO del contrato y en el ORDEN correcto (issues[0] = primer campo que
// falla, igual que el legacy validaba a mano), y normalizan (trim/coerción).
const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
    crearClienteSchema,
    idClienteParam
} = require("../../validation/clientes.schema");
const { crearProductoSchema } = require("../../validation/productos.schema");
const {
    crearDispositivoSchema
} = require("../../validation/dispositivos.schema");
const { crearRiesgoSchema } = require("../../validation/riesgos.schema");
const {
    crearIncidenteSchema,
    resolverIncidenteSchema
} = require("../../validation/incidentes.schema");
const { crearAccesoSchema } = require("../../validation/accesos.schema");
const {
    crearProveedorSchema,
    crearEvaluacionSchema
} = require("../../validation/proveedores.schema");
const {
    crearPedidoSchema,
    actualizarPedidoSchema,
    cambiarEstadoSchema
} = require("../../validation/pedidos.schema");
const { loginSchema } = require("../../validation/auth.schema");
function primerMensaje(schema, dato) {
    const r = schema.safeParse(dato);
    assert.equal(r.success, false, "se esperaba fallo de validación");
    return r.error.issues[0].message;
}

test("cliente: nombre obligatorio", () => {
    assert.equal(
        primerMensaje(crearClienteSchema, { pais: "CR" }),
        "El nombre del cliente es obligatorio"
    );
});

test("cliente: normaliza trim y vacíos a null", () => {
    const r = crearClienteSchema.parse({
        nombre: "  ACME  ",
        pais: "   ",
        correo: "",
        telefono: "  x  "
    });
    assert.equal(r.nombre, "ACME");
    assert.equal(r.pais, null);
    assert.equal(r.correo, null);
    assert.equal(r.telefono, "x");
});
test("cliente: nombre no puede superar los 150 caracteres (VarChar(150) real)", () => {
    assert.equal(
        primerMensaje(crearClienteSchema, { nombre: "a".repeat(151) }),
        "El nombre del cliente no puede superar los 150 caracteres"
    );
    const r = crearClienteSchema.parse({ nombre: "a".repeat(150) });
    assert.equal(r.nombre.length, 150);
});

test("cliente: telefono no puede superar los 30 caracteres (VarChar(30) real)", () => {
    assert.equal(
        primerMensaje(crearClienteSchema, {
            nombre: "ACME",
            telefono: "1".repeat(31)
        }),
        "El teléfono no puede superar los 30 caracteres"
    );
});

test("idParam: rechaza no numérico con mensaje del cliente", () => {
    assert.equal(
        primerMensaje(idClienteParam, { id: "abc" }),
        "El ID del cliente no es válido"
    );
});

test("idParam: coerciona string numérico a entero", () => {
    const r = idClienteParam.parse({ id: "42" });
    assert.equal(r.id, 42);
});

test("idParam: rechaza un id fuera del rango de sql.Int (2147483647)", () => {
    assert.equal(
        primerMensaje(idClienteParam, { id: 2147483648 }),
        "El ID del cliente no es válido"
    );
    const r = idClienteParam.parse({ id: 2147483647 });
    assert.equal(r.id, 2147483647);
});
test("producto: nombre obligatorio", () => {
    assert.equal(
        primerMensaje(crearProductoSchema, {}),
        "El nombre del producto es obligatorio"
    );
});

test("dispositivo: orden responsable -> código -> tipo", () => {
    assert.equal(
        primerMensaje(crearDispositivoSchema, {}),
        "Debe seleccionar un responsable válido"
    );
    assert.equal(
        primerMensaje(crearDispositivoSchema, { id_usuario: 3 }),
        "El código del equipo es obligatorio"
    );
    assert.equal(
        primerMensaje(crearDispositivoSchema, {
            id_usuario: 3,
            codigo_equipo: "EQ1"
        }),
        "El tipo de dispositivo es obligatorio"
    );
});

test("dispositivo: booleanos laxos y fecha opcional", () => {
    const r = crearDispositivoSchema.parse({
        id_usuario: "3",
        codigo_equipo: " EQ1 ",
        tipo_dispositivo: " Laptop ",
        antivirus_activo: 1,
        tiene_ups: 0
    });
    assert.equal(r.id_usuario, 3);
    assert.equal(r.codigo_equipo, "EQ1");
    assert.equal(r.antivirus_activo, true);
    assert.equal(r.tiene_ups, false);
    assert.equal(r.fecha_ultima_actualizacion, null);
    assert.equal(r.sistema_operativo, null);
});
test("dispositivo: booleanoLaxo ya no invierte la cadena false (Boolean(false-string) era true)", () => {
    const base = {
        id_usuario: 3,
        codigo_equipo: "EQ1",
        tipo_dispositivo: "Laptop"
    };
    const r1 = crearDispositivoSchema.parse({
        ...base,
        antivirus_activo: "false",
        tiene_ups: "true"
    });
    assert.equal(r1.antivirus_activo, false);
    assert.equal(r1.tiene_ups, true);

    const r2 = crearDispositivoSchema.parse({
        ...base,
        antivirus_activo: "  FALSE  ",
        tiene_ups: "True"
    });
    assert.equal(r2.antivirus_activo, false);
    assert.equal(r2.tiene_ups, true);
});
test("dispositivo: código no puede superar los 30 caracteres (VarChar(30) real)", () => {
    assert.equal(
        primerMensaje(crearDispositivoSchema, {
            id_usuario: 1,
            codigo_equipo: "a".repeat(31),
            tipo_dispositivo: "Laptop"
        }),
        "El código del equipo no puede superar los 30 caracteres"
    );
});

test("dispositivo: fecha_ultima_actualizacion invalida da un 400 limpio, no un 500 del driver", () => {
    assert.equal(
        primerMensaje(crearDispositivoSchema, {
            id_usuario: 1,
            codigo_equipo: "EQ1",
            tipo_dispositivo: "Laptop",
            fecha_ultima_actualizacion: "no-es-una-fecha"
        }),
        "La fecha de última actualización no es válida"
    );
});

test("proveedor: booleanoLaxo compartido tampoco invierte false en los criterios de evaluacion", () => {
    const r = crearEvaluacionSchema.parse({
        cifrado_datos: "false",
        mfa_disponible: "true",
        sla_definido: 1,
        certificaciones_vigentes: 0
    });
    assert.equal(r.cifrado_datos, false);
    assert.equal(r.mfa_disponible, true);
    assert.equal(r.sla_definido, true);
    assert.equal(r.certificaciones_vigentes, false);
});

test("proveedor: nombre no puede superar los 150 caracteres (VarChar(150) real)", () => {
    assert.equal(
        primerMensaje(crearProveedorSchema, { nombre_proveedor: "a".repeat(151) }),
        "El nombre del proveedor no puede superar los 150 caracteres"
    );
});
test("riesgo: orden y rangos 1-5", () => {
    assert.equal(
        primerMensaje(crearRiesgoSchema, {}),
        "El sistema es obligatorio"
    );
    assert.equal(
        primerMensaje(crearRiesgoSchema, {
            sistema: "S",
            categoria: "C",
            descripcion: "D",
            probabilidad: 9,
            impacto: 3
        }),
        "La probabilidad debe ser un valor entre 1 y 5"
    );
    assert.equal(
        primerMensaje(crearRiesgoSchema, {
            sistema: "S",
            categoria: "C",
            descripcion: "D",
            probabilidad: 3,
            impacto: 0
        }),
        "El impacto debe ser un valor entre 1 y 5"
    );
});

test("riesgo: categoria no puede superar los 30 caracteres (VarChar(30) real)", () => {
    assert.equal(
        primerMensaje(crearRiesgoSchema, {
            sistema: "S",
            categoria: "a".repeat(31),
            descripcion: "D",
            probabilidad: 3,
            impacto: 3
        }),
        "La categoría no puede superar los 30 caracteres"
    );
});
test("incidente: orden plataforma -> responsable -> título -> fecha", () => {
    assert.equal(
        primerMensaje(crearIncidenteSchema, {}),
        "Debe seleccionar una plataforma válida"
    );
    assert.equal(
        primerMensaje(crearIncidenteSchema, { id_plataforma: 1 }),
        "Debe seleccionar un responsable válido"
    );
    assert.equal(
        primerMensaje(crearIncidenteSchema, {
            id_plataforma: 1,
            id_usuario_responsable: 2
        }),
        "El título del incidente es obligatorio"
    );
    assert.equal(
        primerMensaje(crearIncidenteSchema, {
            id_plataforma: 1,
            id_usuario_responsable: 2,
            titulo: "Caída"
        }),
        "La fecha de inicio es obligatoria"
    );
});

test("incidente: titulo no puede superar los 150 caracteres (VarChar(150) real)", () => {
    assert.equal(
        primerMensaje(crearIncidenteSchema, {
            id_plataforma: 1,
            id_usuario_responsable: 2,
            titulo: "a".repeat(151),
            fecha_inicio: "2026-01-01"
        }),
        "El título del incidente no puede superar los 150 caracteres"
    );
});

test("incidente: fecha_inicio con formato invalido da un 400 limpio, no un 500 del driver", () => {
    assert.equal(
        primerMensaje(crearIncidenteSchema, {
            id_plataforma: 1,
            id_usuario_responsable: 2,
            titulo: "Caída",
            fecha_inicio: "no-es-una-fecha"
        }),
        "La fecha de inicio es obligatoria"
    );
});

test("incidente: fecha_resolucion opcional acepta ausente y rechaza formato invalido", () => {
    const r = resolverIncidenteSchema.parse({});
    assert.equal(r.fecha_resolucion, null);
    assert.equal(
        primerMensaje(resolverIncidenteSchema, {
            fecha_resolucion: "no-es-una-fecha"
        }),
        "La fecha de resolución no es válida"
    );
});
test("acceso: orden usuario -> plataforma -> rol -> fecha", () => {
    assert.equal(
        primerMensaje(crearAccesoSchema, {}),
        "Debe seleccionar un usuario válido"
    );
    assert.equal(
        primerMensaje(crearAccesoSchema, { id_usuario: 1 }),
        "Debe seleccionar una plataforma válida"
    );
    assert.equal(
        primerMensaje(crearAccesoSchema, {
            id_usuario: 1,
            id_plataforma: 2
        }),
        "El rol de acceso es obligatorio"
    );
    assert.equal(
        primerMensaje(crearAccesoSchema, {
            id_usuario: 1,
            id_plataforma: 2,
            rol_acceso: "Lector"
        }),
        "La fecha de alta es obligatoria"
    );
});

test("acceso: rol_acceso no puede superar los 100 caracteres (VarChar(100) real)", () => {
    assert.equal(
        primerMensaje(crearAccesoSchema, {
            id_usuario: 1,
            id_plataforma: 2,
            rol_acceso: "a".repeat(101),
            fecha_alta: "2026-01-01"
        }),
        "El rol de acceso no puede superar los 100 caracteres"
    );
});

test("acceso: fecha_alta con formato invalido da un 400 limpio, no un 500 del driver", () => {
    assert.equal(
        primerMensaje(crearAccesoSchema, {
            id_usuario: 1,
            id_plataforma: 2,
            rol_acceso: "Lector",
            fecha_alta: "no-es-una-fecha"
        }),
        "La fecha de alta es obligatoria"
    );
});
test("auth: correo no puede superar los 100 caracteres (VarChar(100) real, mismo mensaje generico del login)", () => {
    assert.equal(
        primerMensaje(loginSchema, {
            correo: "a".repeat(96) + "@x.co",
            password: "algo"
        }),
        "Correo y contraseña son obligatorios"
    );
});
test("pedido: crear rechaza un estado inicial arbitrario (bypass de la maquina de estados)", () => {
    const base = {
        id_cliente: 1,
        detalles: [{ id_producto: 1, cantidad: 1, precio_unitario: 10 }]
    };
    assert.equal(
        primerMensaje(crearPedidoSchema, { ...base, estado: "Bypass" }),
        "El estado indicado no es válido"
    );
});

test("pedido: crear acepta un estado no terminal y preserva el default (ausente/vacio) para el service", () => {
    const base = {
        id_cliente: 1,
        detalles: [{ id_producto: 1, cantidad: 1, precio_unitario: 10 }]
    };
    const r1 = crearPedidoSchema.parse({ ...base, estado: "En proceso" });
    assert.equal(r1.estado, "En proceso");

    const r2 = crearPedidoSchema.parse(base);
    assert.equal(r2.estado, undefined);

    const r3 = crearPedidoSchema.parse({ ...base, estado: "   " });
    assert.equal(r3.estado, "");
});

test("pedido: crear rechaza Cancelado como estado inicial (solo via PATCH /:id/cancelar)", () => {
    const base = {
        id_cliente: 1,
        detalles: [{ id_producto: 1, cantidad: 1, precio_unitario: 10 }]
    };
    assert.equal(
        primerMensaje(crearPedidoSchema, { ...base, estado: "Cancelado" }),
        "El estado indicado no es válido"
    );
});

test("pedido: actualizar y cambiarEstado siguen restringidos a su allow-list respectivo", () => {
    assert.equal(
        primerMensaje(actualizarPedidoSchema, {
            id_cliente: 1,
            fecha: "2026-01-01",
            estado: "Bypass"
        }),
        "El estado indicado no es válido"
    );
    assert.equal(
        primerMensaje(cambiarEstadoSchema, { estado: "Cancelado" }),
        "El estado indicado no es válido"
    );
    assert.equal(
        cambiarEstadoSchema.parse({ estado: "En proceso" }).estado,
        "En proceso"
    );
});

test("pedido: cantidad/precio validos por separado pero que desbordarian el subtotal decimal(14,2)", () => {
    const detalle = {
        id_producto: 1,
        cantidad: 2000000000,
        precio_unitario: 9999999999.99
    };
    assert.equal(
        primerMensaje(crearPedidoSchema, {
            id_cliente: 1,
            detalles: [detalle]
        }),
        "El subtotal de la línea supera el máximo permitido"
    );
});

test("pedido: fecha con formato invalido en actualizar da un 400 limpio, no un 500 del driver", () => {
    assert.equal(
        primerMensaje(actualizarPedidoSchema, {
            id_cliente: 1,
            fecha: "no-es-una-fecha",
            estado: "Pendiente"
        }),
        "La fecha es obligatoria"
    );
});
