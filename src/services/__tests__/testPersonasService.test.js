// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  setPersonaEmail,
  resetPersonaEmail,
} from "../testPersonasService";

describe("testPersonasService.setPersonaEmail (Plan 2026-10-17, advisor gate)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  it("happy path: id válido + email custom → POST a /set-email con body y retorna response.json()", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          personaId: "PERSONA_AGREGAR_EMAIL",
          email: "custom@example.com",
        }),
    };
    global.fetch.mockResolvedValue(mockResponse);

    const result = await setPersonaEmail(
      "PERSONA_AGREGAR_EMAIL",
      "custom@example.com",
    );

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "/api/test/personas/PERSONA_AGREGAR_EMAIL/set-email",
      ),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "custom@example.com" }),
      }),
    );
    expect(result).toEqual({
      success: true,
      personaId: "PERSONA_AGREGAR_EMAIL",
      email: "custom@example.com",
    });
  });

  it("default email: si no se pasa segundo arg, usa 'test.advisor@cofa.local'", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          personaId: "PERSONA_AGREGAR_EMAIL",
          email: "test.advisor@cofa.local",
        }),
    };
    global.fetch.mockResolvedValue(mockResponse);

    const result = await setPersonaEmail("PERSONA_AGREGAR_EMAIL");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({ email: "test.advisor@cofa.local" }),
      }),
    );
    expect(result.email).toBe("test.advisor@cofa.local");
  });

  it("id vacío o inválido ('', 'invalid-id-with-dash', 'lowercase_not_allowed') → throw sin llamar fetch", async () => {
    await expect(setPersonaEmail("", "x@y.com")).rejects.toThrow("id inválido");
    await expect(
      setPersonaEmail("invalid-id-with-dash", "x@y.com"),
    ).rejects.toThrow("id inválido");
    await expect(
      setPersonaEmail("lowercase_not_allowed", "x@y.com"),
    ).rejects.toThrow("id inválido");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("id con más de 64 caracteres → throw (guard de longitud, regresión del brief previo)", async () => {
    const longId = "A".repeat(65);
    await expect(setPersonaEmail(longId, "x@y.com")).rejects.toThrow(
      "id inválido",
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("back responde 404 con body JSON → throw con message del body", async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      json: () =>
        Promise.resolve({ message: "persona no encontrada", error: "NOT_FOUND" }),
    };
    global.fetch.mockResolvedValue(mockResponse);

    await expect(
      setPersonaEmail("PERSONA_FANTASMA", "x@y.com"),
    ).rejects.toThrow("persona no encontrada");
  });

  it("back responde 404 sin JSON → throw con 'HTTP 404'", async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      json: () => Promise.reject(new Error("not json")),
    };
    global.fetch.mockResolvedValue(mockResponse);

    await expect(
      setPersonaEmail("PERSONA_FANTASMA", "x@y.com"),
    ).rejects.toThrow("HTTP 404");
  });

  it("back responde 500 → throw con error del body", async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      json: () =>
        Promise.resolve({
          message: "internal error",
          error: "INTERNAL_SERVER_ERROR",
        }),
    };
    global.fetch.mockResolvedValue(mockResponse);

    await expect(
      setPersonaEmail("PERSONA_AGREGAR_EMAIL", "x@y.com"),
    ).rejects.toThrow("internal error");
  });
});

describe("testPersonasService.resetPersonaEmail (Plan 2026-10-17, advisor gate)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  it("happy path: id válido → POST a /reset-email sin body y retorna response.json()", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          personaId: "PERSONA_AGREGAR_EMAIL",
          email: "",
        }),
    };
    global.fetch.mockResolvedValue(mockResponse);

    const result = await resetPersonaEmail("PERSONA_AGREGAR_EMAIL");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "/api/test/personas/PERSONA_AGREGAR_EMAIL/reset-email",
      ),
      expect.objectContaining({ method: "POST" }),
    );
    expect(result).toEqual({
      success: true,
      personaId: "PERSONA_AGREGAR_EMAIL",
      email: "",
    });
  });

  it("id inválido → throw sin llamar fetch", async () => {
    await expect(resetPersonaEmail("")).rejects.toThrow("id inválido");
    await expect(
      resetPersonaEmail("invalid-id-with-dash"),
    ).rejects.toThrow("id inválido");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("back responde 404 → throw", async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      json: () =>
        Promise.resolve({ message: "persona no encontrada" }),
    };
    global.fetch.mockResolvedValue(mockResponse);

    await expect(
      resetPersonaEmail("PERSONA_FANTASMA"),
    ).rejects.toThrow("persona no encontrada");
  });
});