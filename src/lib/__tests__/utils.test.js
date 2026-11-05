/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteCookie,
  getCookie,
  setCookie,
  setCookieWithDuration,
} from "../utils.js";

const COOKIE_NAME = "leadToken";
const originalCookieDescriptor = Object.getOwnPropertyDescriptor(document, "cookie");

function restorePlatformMocks() {
  vi.restoreAllMocks();
  // Dos spies sobre un accessor pueden dejar un descriptor propio con el
  // setter mockeado. Restablecer exactamente la forma original del documento.
  if (originalCookieDescriptor) {
    Object.defineProperty(document, "cookie", originalCookieDescriptor);
    return;
  }
  Reflect.deleteProperty(document, "cookie");
}

beforeEach(async () => {
  restorePlatformMocks();
  await deleteCookie(COOKIE_NAME);
});

afterEach(async () => {
  restorePlatformMocks();
  await deleteCookie(COOKIE_NAME);
});

describe("utils - cookies con storage bloqueado", () => {
  /**
   * Reproduce el bloqueo silencioso de cookies: la escritura se
   * ignora en silencio Y la lectura no expone nada. Hay que mockear las DOS
   * operaciones: mockear sólo el setter deja el `document.cookie` de jsdom
   * con los valores de tests anteriores, y `getCookie` leería de ahí (tiene
   * prioridad sobre el fallback en memoria) en lugar de caer al `Map`.
   */
  const blockCookies = () => {
    vi.spyOn(document, "cookie", "set").mockImplementation(() => {});
    vi.spyOn(document, "cookie", "get").mockReturnValue("");
  };

  const throwCookieSecurityError = () => {
    throw new DOMException("Acceso a cookies denegado.", "SecurityError");
  };

  it("getCookie devuelve el valor cuando las cookies funcionan", async () => {
    await setCookie(COOKIE_NAME, "jwt-abc", Date.now() + 60_000);

    expect(document.cookie).toContain(`${COOKIE_NAME}=jwt-abc`);
    expect(await getCookie(COOKIE_NAME)).toBe("jwt-abc");
  });

  it("getCookie devuelve el valor persistido en memoria cuando document.cookie no lo expone", async () => {
    blockCookies();

    await setCookie(COOKIE_NAME, "jwt-abc", Date.now() + 60_000);

    expect(await getCookie(COOKIE_NAME)).toBe("jwt-abc");
  });

  it("getCookie devuelve null cuando la cookie no existe", async () => {
    expect(await getCookie(COOKIE_NAME)).toBeNull();
  });

  it("deleteCookie limpia también el valor guardado en memoria", async () => {
    blockCookies();

    await setCookie(COOKIE_NAME, "jwt-abc", Date.now() + 60_000);
    await deleteCookie(COOKIE_NAME);

    expect(await getCookie(COOKIE_NAME)).toBeNull();
  });

  it("el valor guardado en memoria respeta la expiración", async () => {
    blockCookies();

    await setCookie(COOKIE_NAME, "jwt-abc", Date.now() - 1_000);

    expect(await getCookie(COOKIE_NAME)).toBeNull();
  });

  it("setCookieWithDuration persiste un valor utilizable", async () => {
    await setCookieWithDuration(COOKIE_NAME, "jwt-abc", 60_000);

    expect(await getCookie(COOKIE_NAME)).toBe("jwt-abc");
  });

  it("getCookie usa el fallback cuando el getter lanza SecurityError", async () => {
    await setCookie(COOKIE_NAME, "jwt-abc", Date.now() + 60_000);
    vi.spyOn(document, "cookie", "get").mockImplementation(throwCookieSecurityError);

    expect(await getCookie(COOKIE_NAME)).toBe("jwt-abc");
  });

  it("setCookie conserva el valor cuando el setter lanza SecurityError", async () => {
    vi.spyOn(document, "cookie", "set").mockImplementation(throwCookieSecurityError);
    vi.spyOn(document, "cookie", "get").mockReturnValue("");

    await expect(
      setCookie(COOKIE_NAME, "jwt-abc", Date.now() + 60_000),
    ).resolves.toBeUndefined();

    expect(await getCookie(COOKIE_NAME)).toBe("jwt-abc");
  });

  it("deleteCookie limpia el fallback aunque el setter lance SecurityError", async () => {
    vi.spyOn(document, "cookie", "set").mockImplementation(throwCookieSecurityError);
    vi.spyOn(document, "cookie", "get").mockReturnValue("");
    await setCookie(COOKIE_NAME, "jwt-abc", Date.now() + 60_000);
    expect(await getCookie(COOKIE_NAME)).toBe("jwt-abc");

    await expect(deleteCookie(COOKIE_NAME)).resolves.toBeUndefined();

    expect(await getCookie(COOKIE_NAME)).toBeNull();
  });

  it("el fallback deja de devolver un valor válido al alcanzar su expiración", async () => {
    blockCookies();
    const now = Date.now();
    const dateNow = vi.spyOn(Date, "now").mockReturnValue(now);
    await setCookie(COOKIE_NAME, "jwt-abc", now + 60_000);
    expect(await getCookie(COOKIE_NAME)).toBe("jwt-abc");

    dateNow.mockReturnValue(now + 60_000);

    expect(await getCookie(COOKIE_NAME)).toBeNull();
  });

  it("getCookie prioriza la cookie real cuando difiere del fallback", async () => {
    await setCookie(COOKIE_NAME, "jwt-memoria", Date.now() + 60_000);
    document.cookie = `${COOKIE_NAME}=jwt-navegador; path=/`;

    expect(await getCookie(COOKIE_NAME)).toBe("jwt-navegador");
  });
});
