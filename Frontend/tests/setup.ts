import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, expect } from "vitest";
import { toHaveNoViolations } from "jest-axe";
import { servidor } from "./msw/servidor";

expect.extend(toHaveNoViolations);

beforeAll(() => {
  // `error`: un handler que falte es un fallo del test, no un silencio.
  servidor.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  servidor.resetHandlers();
  cleanup();
});

afterAll(() => {
  servidor.close();
});
