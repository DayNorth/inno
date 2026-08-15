import { describe, expect, it } from "vitest";
import { decodificarJwt } from "@/shared/auth/decodificarJwt";

/**
 * Token generado por `jsonwebtoken` con la MISMA forma de claims que firma el
 * backend (`services/auth.service.js`), no construido a mano en el test: un
 * token hecho a medida puede pasar y el real fallar.
 */
const TOKEN_REAL =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJpZF91c3VhcmlvIjoxLCJjb3JyZW8iOiJhbmFAdmlua2FwbGFudC5jciIsImlkX3JvbCI6MSwicm9sIjoiQWRtaW5pc3RyYWRvciIsImlhdCI6MTc4NjE2ODQ4NiwiZXhwIjoxODE3NzA0NDg2fQ." +
  "wQYcvozZpYVA-Sp65wneqNMfltEuZ9Uvtntyf3rKIf0";

describe("decodificarJwt contra un token real del backend", () => {
  it("lee los claims que firma auth.service", () => {
    const claims = decodificarJwt(TOKEN_REAL);

    expect(claims).not.toBeNull();
    expect(claims?.id_usuario).toBe(1);
    expect(claims?.correo).toBe("ana@vinkaplant.cr");
    expect(claims?.id_rol).toBe(1);
    expect(claims?.rol).toBe("Administrador");
  });
});
