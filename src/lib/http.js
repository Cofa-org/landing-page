import { NetworkError } from "./network-error";

function isRetryableNetworkError(err) {
  if (err instanceof TypeError) return true;
  if (err instanceof DOMException && err.name === "TimeoutError") return true;
  return false;
}

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
 * Parsea el string de `xhr.getAllResponseHeaders()` a objeto plano de headers.
 * Formato: `"Content-Type: application/json\r\nX-Foo: bar"`.
 */
function parseXhrHeaders(raw) {
  const result = {};
  if (!raw) return result;
  for (const line of raw.split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const name = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (name) result[name] = value;
  }
  return result;
}

export async function HttpApi(url, body, method, apiKey, token, signal = null, retryConfig = null) {
  const maxAttempts = (retryConfig?.retries ?? 0) + 1;
  const backoffMs = retryConfig?.backoffMs ?? 0;
  const isFormData = body instanceof FormData;
  const timeoutMs = (typeof retryConfig?.timeoutMs === "number" && retryConfig.timeoutMs > 0) ? retryConfig.timeoutMs : 0;

  // XHR helper para multipart: más robusto que fetch en browsers legacy
  // (Samsung Internet, WhatsApp/Facebook/Instagram in-app).
  const xhrRequest = () => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    const cbSessionId = typeof window !== "undefined" ? localStorage.getItem("callbell_session_id") : null;
    if (apiKey) xhr.setRequestHeader("x-api-key", apiKey);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    if (cbSessionId) xhr.setRequestHeader("x-callbell-session-id", cbSessionId);
    // NO setear Content-Type para FormData — browser auto-genera con boundary.
    if (timeoutMs > 0) xhr.timeout = timeoutMs;

    xhr.onload = () => {
      // Construye un Headers object desde el string raw de getAllResponseHeaders()
      // para preservar el contrato fetch Response (mailService.js usa
      // response.headers.get("content-type")).
      const headers = new Headers(xhr.getAllResponseHeaders ? parseXhrHeaders(xhr.getAllResponseHeaders()) : {});
      resolve({
        status: xhr.status,
        ok: xhr.status >= 200 && xhr.status < 300,
        headers,
        json: async () => JSON.parse(xhr.responseText),
        text: async () => xhr.responseText,
      });
    };
    xhr.onerror = () => {
      if (xhr.status === 0) reject(new TypeError("NetworkError"));
      else reject(new TypeError("Failed to fetch"));
    };
    xhr.ontimeout = () => reject(new DOMException("timeout", "TimeoutError"));
    xhr.onabort = () => reject(new DOMException("aborted", "AbortError"));

    if (signal) {
      if (signal.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }
    xhr.send(body);
  });

  const buildOptions = () => {
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

  const shouldWrap = retryConfig !== null;
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    try {
      return isFormData ? await xhrRequest() : await fetch(url, buildOptions());
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
  throw shouldWrap ? new NetworkError(lastError) : lastError;
}
