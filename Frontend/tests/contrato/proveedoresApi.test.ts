import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { ApiError } from "@/shared/api/ApiError";
import { listarProveedores, obtenerProveedor } from "@/features/proveedores/api/proveedoresApi";
import { idProveedor } from "@/shared/tipos/marca";
import { API } from "../msw/manejadores";
import { servidor } from "../msw/servidor";

const SIN_EVALUAR = {
  id_proveedor: 3,
  nombre_proveedor: "Vivero Sin Evaluar",
  tipo_servicio: null,
  estado_contrato: "Activo",
  id_evaluacion: null,
  fecha_evaluacion: null,
  puntaje_total: null,
  resultado: null,
  nivel_riesgo: null,
};

describe("frontera de confianza de /api/proveedores", () => {
  /**
   * Los 5 campos de la ultima evaluacion vienen `null` EN BLOQUE cuando el
   * proveedor no tiene ninguna (contrato §5.2). En la practica no ocurre, pero
   * el tipo lo admite y la guarda tiene que aceptarlo sin romperse.
   */
  it("acepta los 5 campos de la ultima evaluacion nulos en bloque", async () => {
    servidor.use(
      http.get(`${API}/api/proveedores`, () => HttpResponse.json([SIN_EVALUAR])),
    );

    const [proveedor] = await listarProveedores();

    expect(proveedor?.resultado).toBeNull();
    expect(proveedor?.nivel_riesgo).toBeNull();
    expect(proveedor?.puntaje_total).toBeNull();
  });

  it("rechaza un nivel de riesgo fuera del conjunto cerrado", async () => {
    servidor.use(
      http.get(`${API}/api/proveedores`, () =>
        HttpResponse.json([{ ...SIN_EVALUAR, nivel_riesgo: "Critico" }]),
      ),
    );

    await expect(listarProveedores()).rejects.toBeInstanceOf(ApiError);
  });

  /** El driver `mssql` puede devolver `decimal` como string segun config. */
  it("acepta un puntaje que llega como string", async () => {
    servidor.use(
      http.get(`${API}/api/proveedores`, () =>
        HttpResponse.json([
          {
            ...SIN_EVALUAR,
            id_evaluacion: 9,
            fecha_evaluacion: "2026-07-16",
            puntaje_total: "75.00",
            resultado: "Aprobado",
            nivel_riesgo: "Medio",
          },
        ]),
      ),
    );

    const [proveedor] = await listarProveedores();
    expect(proveedor?.puntaje_total).toBe(75);
  });

  it("verifica las listas anidadas del detalle", async () => {
    servidor.use(
      http.get(`${API}/api/proveedores/3`, () =>
        HttpResponse.json({
          id_proveedor: 3,
          nombre_proveedor: "Vivero Sur",
          tipo_servicio: "Logistica",
          estado_contrato: "Activo",
          evaluaciones: [
            {
              id_evaluacion: 9,
              fecha_evaluacion: "2026-07-16",
              cifrado_datos: 1,
              mfa_disponible: 0,
              sla_definido: true,
              certificaciones_vigentes: false,
              puntaje_total: 50,
              resultado: "Rechazado",
              nivel_riesgo: "Alto",
            },
          ],
          planes_contingencia: [],
        }),
      ),
    );

    const proveedor = await obtenerProveedor(idProveedor(3));

    // `bit` de SQL Server puede llegar como 0/1: la guarda lo normaliza.
    expect(proveedor.evaluaciones[0]?.cifrado_datos).toBe(true);
    expect(proveedor.evaluaciones[0]?.mfa_disponible).toBe(false);
    expect(proveedor.planes_contingencia).toEqual([]);
  });

  it("una evaluacion malformada tumba la respuesta entera, no a medias", async () => {
    servidor.use(
      http.get(`${API}/api/proveedores/3`, () =>
        HttpResponse.json({
          id_proveedor: 3,
          nombre_proveedor: "Vivero Sur",
          tipo_servicio: null,
          estado_contrato: "Activo",
          evaluaciones: [{ id_evaluacion: "nueve" }],
          planes_contingencia: [],
        }),
      ),
    );

    await expect(obtenerProveedor(idProveedor(3))).rejects.toSatisfy(
      (e: unknown) => e instanceof ApiError && e.clase === "contrato",
    );
  });
});
