// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { parseErrorResponse } from "../http-error";

/**
 * Helper: construye un Response fake con un content-type y body dados.
 * Replica el shape de la Response de fetch para que parseErrorResponse
 * lo consuma sin tocar la red.
 */
function buildResponse({ status, contentType, body }) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: {
      get: (name) => (name.toLowerCase() === "content-type" ? contentType : null),
    },
    text: async () => body,
    json: async () => JSON.parse(body),
  };
}

describe("parseErrorResponse", () => {
  it("parsea JSON cuando Content-Type es application/json (error del backend)", async () => {
    const response = buildResponse({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({ message: "DNI requerido", cause: "DNI_REQUIRED" }),
    });

    const result = await parseErrorResponse(response);

    expect(result).toEqual({
      status: 400,
      message: "DNI requerido",
      cause: "DNI_REQUIRED",
      rawBody: '{"message":"DNI requerido","cause":"DNI_REQUIRED"}',
    });
  });

  it("parsea texto plano cuando Content-Type NO es JSON (429 de express-rate-limit)", async () => {
    const response = buildResponse({
      status: 429,
      contentType: "text/plain; charset=utf-8",
      body: "Too many requests, please try again later.",
    });

    const result = await parseErrorResponse(response);

    expect(result).toEqual({
      status: 429,
      message: "Too many requests, please try again later.",
      cause: null,
      rawBody: "Too many requests, please try again later.",
    });
  });

  it("parsea texto plano como fallback cuando Content-Type falta", async () => {
    const response = buildResponse({
      status: 502,
      contentType: null,
      body: "Bad Gateway",
    });

    const result = await parseErrorResponse(response);

    expect(result).toEqual({
      status: 502,
      message: "Bad Gateway",
      cause: null,
      rawBody: "Bad Gateway",
    });
  });

  it("parsea text/html como texto (no como JSON)", async () => {
    const response = buildResponse({
      status: 500,
      contentType: "text/html",
      body: "<html>Internal Server Error</html>",
    });

    const result = await parseErrorResponse(response);

    expect(result.message).toBe("<html>Internal Server Error</html>");
    expect(result.cause).toBe(null);
  });

  it("NO lanza cuando el body es texto plano que parece JSON inválido (no rompe 'Too many r...')", async () => {
    // Caso del bug original: backend retorna 429 con texto
    // "Too many requests, please try again later." y el front hacía
    // response.json() → SyntaxError: Unexpected token 'T', "Too many r"...
    const response = buildResponse({
      status: 429,
      contentType: "text/plain",
      body: "Too many requests, please try again later.",
    });

    // Antes del fix esto tiraba SyntaxError. Después del fix, retorna
    // un objeto con el mensaje.
    await expect(parseErrorResponse(response)).resolves.toBeDefined();
  });

  it("mantiene el contrato cuando el JSON de error no tiene 'message' (usa fallback)", async () => {
    const response = buildResponse({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "internal" }),
    });

    const result = await parseErrorResponse(response);

    // No hay "message" en el body. El caller va a usar statusText (500 → "Internal Server Error")
    expect(result.message).toBeUndefined();
    expect(result.cause).toBeNull();
    expect(result.rawBody).toBe('{"error":"internal"}');
  });

  it("usa 'application/json' con charset", async () => {
    const response = buildResponse({
      status: 422,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ message: "Validation failed", cause: "VALIDATION" }),
    });

    const result = await parseErrorResponse(response);

    expect(result.message).toBe("Validation failed");
    expect(result.cause).toBe("VALIDATION");
  });
});
