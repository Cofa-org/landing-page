// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { NetworkError, getFriendlyErrorMessage } from "../network-error";

describe("NetworkError", () => {
  it("extends Error y es identificable con instanceof", () => {
    const original = new TypeError("Failed to fetch");
    const err = new NetworkError(original);

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(NetworkError);
    expect(err.name).toBe("NetworkError");
    expect(err.code).toBe("NETWORK_ERROR");
    expect(err.message).toBe("Failed to fetch");
    expect(err.cause).toBe(original);
  });

  it("usa mensaje fallback cuando el error original no tiene message", () => {
    const err = new NetworkError({});

    expect(err.message).toBe("Network error");
    expect(err.code).toBe("NETWORK_ERROR");
  });

  it("acepta undefined como error original sin tirar", () => {
    expect(() => new NetworkError(undefined)).not.toThrow();
  });
});

describe("getFriendlyErrorMessage", () => {
  it("devuelve mensaje amigable en español para NetworkError", () => {
    const err = new NetworkError(new TypeError("Failed to fetch"));

    expect(getFriendlyErrorMessage(err)).toBe(
      "Sin conexión — verificá tu WiFi y volvé a intentar",
    );
  });

  it("preserva err.message para errores genéricos (no toca servidores lentos, etc.)", () => {
    const err = new Error("Token inválido o expirado");

    expect(getFriendlyErrorMessage(err)).toBe("Token inválido o expirado");
  });

  it("devuelve 'Error de conexión' cuando el error no tiene message (fallback defensivo)", () => {
    expect(getFriendlyErrorMessage(new Error(""))).toBe("Error de conexión");
  });

  it("devuelve 'Error de conexión' cuando se le pasa null/undefined", () => {
    expect(getFriendlyErrorMessage(null)).toBe("Error de conexión");
    expect(getFriendlyErrorMessage(undefined)).toBe("Error de conexión");
  });
});
