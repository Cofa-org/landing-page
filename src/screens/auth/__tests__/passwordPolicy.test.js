import { describe, it, expect } from "vitest";
import { getPasswordPolicyError, isPasswordPolicyValid } from "../passwordPolicy.js";

describe("passwordPolicy", () => {
  it("acepta 8 caracteres con número y símbolo, espacios incluidos", () => {
    expect(isPasswordPolicyValid("pass 1!x")).toBe(true);
    expect(isPasswordPolicyValid("frase larga con espacios 7 €")).toBe(true);
  });

  it("no exige mayúsculas y acepta unicode", () => {
    expect(isPasswordPolicyValid("contraseña1!")).toBe(true);
  });

  it("cuenta code points: un emoji vale 1", () => {
    expect(isPasswordPolicyValid("1" + "😀".repeat(7))).toBe(true);
    expect(isPasswordPolicyValid("1" + "😀".repeat(63))).toBe(true);
    expect(getPasswordPolicyError("1" + "😀".repeat(64))).toMatch(/64/);
  });

  it("rechaza menos de 8", () => {
    expect(getPasswordPolicyError("ab1!xyz")).toMatch(/al menos 8/);
  });

  it("rechaza sin número o sin símbolo", () => {
    expect(getPasswordPolicyError("password!")).toMatch(/número y un símbolo/);
    expect(getPasswordPolicyError("password1")).toMatch(/número y un símbolo/);
  });

  it("el espacio no cuenta como símbolo", () => {
    expect(isPasswordPolicyValid("pass word 1")).toBe(false);
  });
});
