// @vitest-environment node
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

const html = readFileSync(new URL("../../../index.html", import.meta.url), "utf8");
const bootstrap = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
  .find(([, script]) => script.includes("callbell_session_id"))?.[1];

describe("arranque de Callbell", () => {
  it.each([
    ["id persistido", "id-persistido", false, false],
    ["lectura denegada", null, true, false],
    ["escritura denegada", null, false, true],
  ])("publica el identifier con %s", (_mode, savedId, blockRead, blockWrite) => {
    const storage = {
      getItem: () => savedId,
      setItem: () => {
        if (blockWrite) throw new DOMException("Sin cuota", "QuotaExceededError");
      },
    };
    const context = {
      window: {},
      crypto: { randomUUID: () => "id-generado" },
    };
    Object.defineProperty(context, "localStorage", {
      get() {
        if (blockRead) throw new DOMException("Acceso denegado", "SecurityError");
        return storage;
      },
    });

    expect(bootstrap).toBeTypeOf("string");
    expect(() => runInNewContext(bootstrap, context)).not.toThrow();
    expect(context.window.callbellSettings).toMatchObject({
      uuid: expect.any(String),
      script_token: expect.any(String),
      extra_params: { identifier: savedId || "id-generado" },
    });
  });
});
