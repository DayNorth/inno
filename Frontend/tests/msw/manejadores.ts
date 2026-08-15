import { http, HttpResponse } from "msw";
import { aListaClientes } from "@/features/clientes/dominio/cliente";
import { aListaRiesgos } from "@/features/riesgos/dominio/riesgo";

export const API = "http://localhost:3001";

export const CLIENTES_DE_PRUEBA = [
  {
    id_cliente: 1,
    nombre: "ZhanHao Ltd",
    pais: "China",
    correo: "compras@zhanhao.example",
    telefono: "+86 555 1234",
    estado: "Activo",
  },
  {
    id_cliente: 2,
    nombre: "Asia Botanical Trading",
    pais: null,
    correo: null,
    telefono: null,
    estado: "Inactivo",
  },
];

export const RIESGOS_DE_PRUEBA = [
  {
    id_riesgo: 7,
    sistema: "ERP",
    categoria: "Disponibilidad",
    descripcion: "Caida del proveedor de nube",
    probabilidad: 4,
    impacto: 5,
    control_mitigante: null,
    fecha_registro: "2026-07-16",
  },
];

/**
 * Los mocks pasan por las MISMAS guardas de dominio que la aplicacion: un
 * handler que se desvie del contrato falla el test en vez de dar falsa
 * confianza (arquitectura §10).
 */
aListaClientes(CLIENTES_DE_PRUEBA);
aListaRiesgos(RIESGOS_DE_PRUEBA);

export const manejadores = [
  http.get(`${API}/api/clientes`, () => HttpResponse.json(CLIENTES_DE_PRUEBA)),
  http.get(`${API}/api/riesgos`, () => HttpResponse.json(RIESGOS_DE_PRUEBA)),
  http.post(`${API}/api/clientes`, () =>
    HttpResponse.json({ mensaje: "Cliente creado correctamente" }, { status: 201 }),
  ),
];
