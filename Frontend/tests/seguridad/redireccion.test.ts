import { describe, expect, it } from "vitest";
import { rutaInternaSegura, urlDeLoginDesde } from "@/shared/auth/redireccion";

describe("rutaInternaSegura", () => {
  it("acepta rutas internas con query y hash", () => {
    expect(rutaInternaSegura("/pedidos/12?ver=1#lineas")).toBe(
      "/pedidos/12?ver=1#lineas",
    );
  });

  it.each([
    "https://evil.example", // URL absoluta
    "//evil.example", // protocol-relative
    "/\\evil.example", // varios navegadores lo normalizan a "//evil"
    "javascript:alert(1)", // esquema peligroso
    "pedidos", // ruta relativa
    "",
  ])("rechaza %s y cae a Inicio", (entrada) => {
    expect(rutaInternaSegura(entrada)).toBe("/");
  });

  it.each([null, undefined])("rechaza %s y cae a Inicio", (entrada) => {
    expect(rutaInternaSegura(entrada)).toBe("/");
  });

  it("rechaza cadenas con caracteres de control", () => {
    expect(rutaInternaSegura("/pedidos" + String.fromCharCode(10) + "/1")).toBe("/");
  });
});

describe("urlDeLoginDesde", () => {
  it("conserva el destino interno en `next`", () => {
    expect(urlDeLoginDesde("/riesgos")).toBe("/login?next=%2Friesgos");
  });

  it("no propaga un destino externo", () => {
    expect(urlDeLoginDesde("https://evil.example")).toBe("/login");
  });
});
