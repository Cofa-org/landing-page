/**
 * Parser defensivo de respuestas de error de fetch.
 *
 * Contexto: el caller hace `if (!response.ok) { ... }`. Asumir que el
 * body es JSON es incorrecto — el backend puede responder con texto plano
 * en casos no-controlados por la app, como:
 *   - 429 "Too many requests, please try again later." de express-rate-limit
 *   - 502/503/504 del reverse proxy (nginx, Cloudflare)
 *   - Errores genéricos del servidor (500 con HTML)
 *
 * Bug histórico 2026-08-03: el front hacía `await response.json()` sobre
 * un 429 con body "Too many requests, please try again later." → tiraba
 * SyntaxError: Unexpected token 'T', "Too many r"... is not valid JSON.
 * El usuario veía un error de parser en vez del mensaje real.
 *
 * Contrato:
 *   - Siempre retorna un objeto { status, message, cause?, rawBody }
 *   - SIEMPRE lee el body completo (text()) ANTES de intentar JSON.parse
 *     para que un body parcialmente JSON no haga tirar el response.json()
 *     original (que clona el body).
 *   - Para Content-Type "application/json", intenta parsear como JSON
 *     y retorna { message, cause } si están presentes.
 *   - Para cualquier otro Content-Type (text/plain, text/html, null),
 *     retorna el body crudo como `message`.
 *   - Si el JSON parse falla pese al Content-Type correcto (backend
 *     bug), retorna el body crudo como fallback (no tira).
 */
export async function parseErrorResponse(response) {
  const status = response.status;
  const rawBody = await response.text();
  const contentType = response.headers?.get?.("content-type") || "";
  const isJson = contentType.toLowerCase().includes("application/json");

  if (isJson && rawBody) {
    try {
      const parsed = JSON.parse(rawBody);
      return {
        status,
        message: parsed.message,
        // ?? null garantiza que `cause` siempre es un valor predecible
        // (null cuando no hay JSON, parsed.cause cuando hay JSON pero
        // falta el campo). Evita `result.cause === undefined` que rompe
        // checks tipo `if (response.cause === "PHONE_NOT_VALIDATED")`.
        cause: parsed.cause ?? null,
        rawBody,
      };
    } catch {
      // JSON parse falló pese al Content-Type. Fallback a texto crudo
      // (no propagamos el SyntaxError: el caller ya sabe que el server
      // está rotas y necesita un mensaje user-facing).
    }
  }

  return {
    status,
    message: rawBody || undefined,
    cause: null,
    rawBody,
  };
}
