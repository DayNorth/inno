import { describe, expect, it } from "vitest";
import { enteroDeRuta, idPedidoDesde } from "@/shared/tipos/marca";

/**
 * `/pedidos/abc` debe convertirse en un 404 del router ANTES de tocar la red.
 * Sin esto, el parametro llegaba al loader y generaba una peticion inutil que
 * el backend rechazaba con 400.
 */
describe("enteroDeRuta", () => {
  it("acepta un entero positivo", () => {
    expect(enteroDeRuta("1003")).toBe(1003);
  });

  it.each(["abc", "", "0", "-5", "1.5", "1e3", " 7", "7 ", "٣"])(
    "lanza un 404 para %s",
    (bruto) => {
      expect(() => enteroDeRuta(bruto)).toThrow(Response);
    },
  );

  it("lanza un 404 cuando el parametro no existe", () => {
    expect(() => enteroDeRuta(undefined)).toThrow(Response);
  });

  it("rechaza un id mayor que el tope de int de SQL Server", () => {
    expect(() => enteroDeRuta("2147483648")).toThrow(Response);
    expect(enteroDeRuta("2147483647")).toBe(2147483647);
  });

  it("la respuesta lanzada es un 404, no un 500", () => {
    try {
      enteroDeRuta("abc");
      expect.unreachable("deberia haber lanzado");
    } catch (e) {
      expect(e).toBeInstanceOf(Response);
      expect((e as Response).status).toBe(404);
    }
  });

  it("idPedidoDesde marca el tipo tras validar", () => {
    expect(idPedidoDesde("12")).toBe(12);
  });
});
