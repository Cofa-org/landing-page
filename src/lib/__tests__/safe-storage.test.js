/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  safeGetLocalStorageItem,
  safeRemoveLocalStorageItem,
  safeSetLocalStorageItem,
} from "../safe-storage.js";

/**
 * Reproduce el modo de falla real de Chromium: cuando el documento no tiene
 * acceso al storage, la PROPIEDAD `window.localStorage` lanza al leerla.
 * Un mock de `getItem` que lanza NO alcanza, porque el acceso a la propiedad
 * es justamente lo que revienta.
 */
function blockLocalStorage() {
  vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
    throw new DOMException(
      "Failed to read the 'localStorage' property from 'Window': Access is denied for this document.",
      "SecurityError",
    );
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("safe-storage", () => {
  it("devuelve el valor persistido cuando el browser permite el acceso", () => {
    window.localStorage.setItem("otp_cooldown_expiry", "1792756920000");

    expect(safeGetLocalStorageItem("otp_cooldown_expiry")).toBe("1792756920000");
  });

  it("devuelve null en vez de lanzar cuando el browser deniega el acceso", () => {
    blockLocalStorage();

    expect(safeGetLocalStorageItem("otp_cooldown_expiry")).toBeNull();
  });

  it("no propaga la excepción al escribir cuando el browser deniega el acceso", () => {
    blockLocalStorage();

    expect(() => safeSetLocalStorageItem("otp_cooldown_expiry", "1792756920000")).not.toThrow();
  });

  it("no propaga la excepción al borrar cuando el browser deniega el acceso", () => {
    blockLocalStorage();

    expect(() => safeRemoveLocalStorageItem("otp_cooldown_expiry")).not.toThrow();
  });

  it("escribe y borra en el storage cuando el browser permite el acceso", () => {
    safeSetLocalStorageItem("otp_cooldown_expiry", "1792756920000");
    expect(window.localStorage.getItem("otp_cooldown_expiry")).toBe("1792756920000");

    safeRemoveLocalStorageItem("otp_cooldown_expiry");
    expect(window.localStorage.getItem("otp_cooldown_expiry")).toBeNull();
  });
});
