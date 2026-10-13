import { describe, it, expect } from "vitest";
import { RESET_TOKEN_RE } from "../useResetPassword.js";

describe("RESET_TOKEN_RE", () => {
  it("acepta tokens opacos de 10+ chars del charset", () => {
    expect(RESET_TOKEN_RE.test("valid-token-12345")).toBe(true);
    expect(RESET_TOKEN_RE.test("abcdefghij")).toBe(true);
  });

  it("rechaza token corto o con caracteres fuera del charset", () => {
    expect(RESET_TOKEN_RE.test("short")).toBe(false);
    expect(RESET_TOKEN_RE.test("token con espacio")).toBe(false);
    expect(RESET_TOKEN_RE.test("")).toBe(false);
  });
});
