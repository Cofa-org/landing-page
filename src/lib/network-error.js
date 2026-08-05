/**
 * Error tipificado para distinguir fallos de red (type-error del fetch) de
 * fallos del backend (HTTP 4xx/5xx). Usado por HttpApi para wrappear el
 * `TypeError: Failed to fetch` que tira Chromium cuando un fetch no llega
 * a ningún HTTP response (network failure, CORS preflight abort, etc.).
 *
 * Bug 2026-08-05: el síntoma "Failed to fetch" del cliente sin logs en
 * Railway se confunde con "server error" si no hay un tipo dedicado. El
 * backend del back nunca vio el request, así que cualquier mensaje
 * genérico ("Error de conexión") no ayudaba al usuario a saber que era
 * un tema de WiFi. La rama de friendly message usa instanceof para
 * diferenciar.
 *
 * Contrato:
 *   - `name === "NetworkError"` para que stack traces sean claros.
 *   - `code === "NETWORK_ERROR"` para callers que prefieren switch
 *     sobre string que instanceof.
 *   - `cause` preserva el error original del fetch (TypeError o
 *     DOMException) para debugging.
 *   - Si el original no tiene message, usa "Network error" como
 *     fallback para no propagar undefined.
 */
export class NetworkError extends Error {
  constructor(originalError) {
    super(originalError?.message ?? "Network error");
    this.name = "NetworkError";
    this.code = "NETWORK_ERROR";
    this.cause = originalError;
  }
}

/**
 * Mapea un error a un mensaje user-facing en español.
 *
 * - `NetworkError` → mensaje específico de WiFi/red (guía al usuario
 *   a verificar su conexión, no a reintentar ciegamente).
 * - Otros errores → preserva `err.message` para que mensajes del
 *   backend (Token inválido, archivo demasiado grande, etc.) lleguen
 *   al usuario sin que el front los enmascare.
 * - Fallback final: "Error de conexión" para errores sin message
 *   (no propagación de "" porque mostraría un mensaje vacío).
 *
 * Esta función es la única que decide cómo se muestra un error al
 * usuario; los hooks de upload la llaman en su `catch`. No inline en
 * cada hook — un cambio de wording se hace una vez.
 */
export function getFriendlyErrorMessage(err) {
  if (err instanceof NetworkError) {
    return "Sin conexión — verificá tu WiFi y volvé a intentar";
  }
  return err?.message || "Error de conexión";
}
