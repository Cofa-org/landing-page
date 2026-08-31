
import { NetworkError } from "./network-error";

/**
 * Identifica fallos de red puros del fetch (no errores HTTP).
 *
 * `TypeError: Failed to fetch` es lo que tira Chromium cuando el socket
 * TCP muere antes de cualquier HTTP response (WiFi cut, DNS fail, CORS
 * preflight abort). En Firefox el mensaje es "NetworkError when
 * attempting to fetch resource" pero también es instanceof TypeError
 * semánticamente — es la convención del DOM spec ya adoptada por
 * ambos browsers.
 *
 * NO incluimos AbortError en esta lista: si el caller aborta
 * intencionalmente, no queremos reintentar (su request ya no le
 * interesa).
 */
function isRetryableNetworkError(err) {
  return err instanceof TypeError;
}

/**
 * Espera `ms` ms, abortable. Si el signal se aborta durante el delay,
 * rechaza con DOMException("Aborted", "AbortError") inmediatamente y
 * limpia el timer.
 */
function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    if (signal) signal.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Wrapper de fetch con retry opcional para errores de red.
 *
 * El retry aplica sólo a `TypeError` (la marca de network failure).
 * NO reintentamos respuestas HTTP 4xx/5xx: son errores del server y
 * reintentar no cambia el outcome. El caller debe manejar esos por
 * su cuenta (e.g. `parseErrorResponse` para body no-JSON).
 *
 * Args:
 *   - url, body, method, apiKey, token: como antes.
 *   - signal: AbortController.signal del caller. Si aborta, todo
 *     intento en curso aborta y NO se intenta el siguiente.
 *   - retryConfig: { retries, backoffMs } o null/undefined. Si null,
 *     comportamiento legacy (un solo intento, sin retry).
 *
 * Comportamiento:
 *   - maxAttempts = retries + 1.
 *   - Si el último intento falla con TypeError, se envuelve en
 *     NetworkError antes de propagar (así el caller puede mostrar
 *     un mensaje user-facing diferenciado).
 *   - Si aborta, propaga el AbortError sin envolver.
 */
export async function HttpApi(url, body, method, apiKey, token, signal = null, retryConfig = null) {
  const maxAttempts = (retryConfig?.retries ?? 0) + 1;
  const backoffMs = retryConfig?.backoffMs ?? 0;
  const isFormData = body instanceof FormData;

  const buildOptions = () => {
    // Intentamos recuperar el ID de sesión de Callbell si fue generado
    const cbSessionId = typeof window !== "undefined" ? localStorage.getItem("callbell_session_id") : null;
    return {
      headers: {
        ...(apiKey && { "x-api-key": apiKey }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(!isFormData && { "Content-Type": "application/json" }),
        ...(cbSessionId && { "x-callbell-session-id": cbSessionId }),
      },
      method,
      ...(body && { body: isFormData ? body : JSON.stringify(body) }),
      ...(signal && { signal }),
    };
  };

  // Sólo wrappeamos TypeError en NetworkError cuando el caller optó por
  // retry. Sin retryConfig, propagamos el TypeError crudo para no
  // cambiar el comportamiento de los 22+ call-sites existentes (varios
  // servicios chequean `err.message` directamente en su catch). El
  // friendly error message de los hooks de upload sigue funcionando
  // porque ÉSOS pasan retryConfig → HttpApi les entrega NetworkError.
  const shouldWrap = retryConfig !== null;
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    try {
      return await fetch(url, buildOptions());
    } catch (err) {
      lastError = err;
      const isLast = attempt === maxAttempts;
      if (isLast || !isRetryableNetworkError(err)) {
        if (shouldWrap && isRetryableNetworkError(err)) {
          throw new NetworkError(err);
        }
        throw err;
      }
      await delay(backoffMs, signal);
    }
  }
  // Defensa: el loop siempre retorna o tira adentro; este throw es
  // inalcanzable pero mantiene el flow-control explícito.
  throw shouldWrap ? new NetworkError(lastError) : lastError;
}
