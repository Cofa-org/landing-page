// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HttpApi } from "../http";
import { NetworkError } from "../network-error";

/**
 * Helper: arma un Response fake estilo fetch (status + ok + json).
 * Replica el shape que HttpApi consume vía `response.json()`.
 */
function buildResponse({ status, body }) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  };
}

describe("HttpApi", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("devuelve la response del fetch cuando el primer intento tiene éxito (sin retry)", async () => {
    const ok = buildResponse({ status: 200, body: { success: true } });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(ok);

    const promise = HttpApi("https://api.test/x", { foo: 1 }, "POST", "k", "t");
    await expect(promise).resolves.toBe(ok);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("reintenta UNA vez con TypeError y devuelve la response del segundo intento", async () => {
    const ok = buildResponse({ status: 200, body: { success: true } });
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(ok);

    const promise = HttpApi(
      "https://api.test/x",
      { foo: 1 },
      "POST",
      "k",
      "t",
      null,
      { retries: 1, backoffMs: 1500 },
    );

    // Primer intento rejected → delay 1500ms → segundo intento resolved.
    await vi.advanceTimersByTimeAsync(1500);
    await expect(promise).resolves.toBe(ok);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("envuelve el TypeError en NetworkError cuando se acaban los retries", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new TypeError("Failed to fetch"));

    const promise = HttpApi(
      "https://api.test/x",
      { foo: 1 },
      "POST",
      "k",
      "t",
      null,
      { retries: 1, backoffMs: 1500 },
    );

    // Carrera: el primer intento rechaza SINCRONAMENTE al ser agendado,
    // así que el .catch handling captura el error y entra al delay. Para
    // que el test no quede colgado en timers, rechazamos "tan rápido como
    // sea posible" con el segundo rechazo virtual.
    const expectation = expect(promise).rejects.toBeInstanceOf(NetworkError);
    await vi.advanceTimersByTimeAsync(1500);
    await expectation;

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("NO reintenta en respuestas HTTP 5xx (son errores del server, no transient)", async () => {
    const serverError = buildResponse({ status: 500, body: { message: "boom" } });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(serverError);

    const promise = HttpApi(
      "https://api.test/x",
      { foo: 1 },
      "POST",
      "k",
      "t",
      null,
      { retries: 2, backoffMs: 1500 },
    );

    // No hay timers que avanzar: el primer intento ya resolvió con 500
    // y NO entra al catch.
    await expect(promise).resolves.toBe(serverError);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("tira AbortError inmediatamente si el signal ya está aborted antes del primer intento", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(buildResponse({ status: 200 }));

    const promise = HttpApi(
      "https://api.test/x",
      { foo: 1 },
      "POST",
      "k",
      "t",
      controller.signal,
      { retries: 1, backoffMs: 1500 },
    );

    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("aborta el retry si el signal aborta durante el delay entre intentos", async () => {
    const controller = new AbortController();
    const ok = buildResponse({ status: 200, body: { success: true } });
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(ok);

    const promise = HttpApi(
      "https://api.test/x",
      { foo: 1 },
      "POST",
      "k",
      "t",
      controller.signal,
      { retries: 1, backoffMs: 1500 },
    );

    // Avanzamos 100ms (durante el delay original) y abortamos.
    await vi.advanceTimersByTimeAsync(100);
    controller.abort();

    // El AbortError del delay aborta el retry; el segundo fetch NO se dispara.
    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("NO reintenta si no se pasa retryConfig (backward compatible con todo el resto del codebase)", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new TypeError("Failed to fetch"));

    const promise = HttpApi("https://api.test/x", { foo: 1 }, "POST", "k", "t");

    await expect(promise).rejects.toBeInstanceOf(TypeError);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
