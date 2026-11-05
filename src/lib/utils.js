// Utility functions for the application

export function formatCurrency(amount) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(amount);
}

export function roundToFiveHundreds(amount) {
  return Math.round(amount / 500) * 500;
}

export function formatDate(date) {
  return new Intl.DateTimeFormat("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle(func, limit) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Cookie helpers — usando document.cookie directamente. CookieStore API fue
// removida porque NO codifica automáticamente el value (a diferencia de
// document.cookie) y rechaza caracteres como " y , por RFC 6265 cookie-octet.
// Eso rompía el store de loanInfo (JSON.stringify produce ambos chars).
// document.cookie con encodeURIComponent cubre todos los chars prohibidos.
//
// Fallback en memoria: el bloqueo de cookies puede ignorar la escritura en
// silencio y devolver "" al leer. En documentos restringidos, el getter o
// el setter también pueden lanzar SecurityError. Como `leadToken` transporta
// el JWT al backend mediante Authorization, ambos modos de falla deben
// conservar el token disponible en memoria para las requests posteriores.
//
// El Map de abajo replica en memoria lo que la app intenta persistir, con su
// timestamp de expiración, para que la sesión en curso siga funcionando
// aunque el browser no coopere. Se pierde al recargar la página: sin storage
// no hay forma de persistir entre navegaciones.
//
// Nota de seguridad: acá sólo se guardan cookies que el front ya posee —
// las cuatro se escriben con `document.cookie`, o sea que ninguna es
// httpOnly y el JS ya podía leerlas. El Map no agrega una vía de exposición
// nueva; además no se envía solo en cada request, como sí lo hace una cookie
// con path=/. La cookie de sesión de auth (httpOnly) nunca pasa por acá:
// el front no la ve.
const cookieMemoryFallback = new Map();

/**
 * Lee una cookie, primero del navegador y después del fallback en memoria.
 *
 * @param {string} name Nombre de la cookie.
 * @returns {Promise<string|null>} El valor, o `null` si la cookie no existe.
 */
export async function getCookie(name) {
  const fromDocument = readCookieFromDocument(name);
  if (fromDocument !== null) return fromDocument;

  const fromMemory = cookieMemoryFallback.get(name);
  if (!fromMemory) return null;
  if (fromMemory.expiresAt <= Date.now()) {
    cookieMemoryFallback.delete(name);
    return null;
  }
  return fromMemory.value;
}

/**
 * Escribe una cookie en el navegador y la replica en el fallback en memoria.
 *
 * @param {string} name Nombre de la cookie.
 * @param {string} value Valor a guardar.
 * @param {Date|number} expires Instante de expiración.
 * @returns {Promise<void>}
 */
export async function setCookie(name, value, expires) {
  const expiresAt = new Date(expires).getTime();
  const expiresStr = new Date(expires).toUTCString();
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expiresStr}; path=/`;
  } catch (cookieWriteBlocked) {
    // El browser deniega la escritura: el valor queda sólo en el fallback.
  }
  cookieMemoryFallback.set(name, {
    value,
    // NaN (expiración inválida) se trata como cookie de sesión: nunca expira.
    expiresAt: Number.isNaN(expiresAt) ? Infinity : expiresAt,
  });
}

/**
 * Helper para evitar que el call-site olvide sumar Date.now() a una duración.
 * Pasa directamente la duración (en ms) a setCookie; el wrapper hace el
 * `Date.now() + durationMs` por vos. Sin esto, olvidar Date.now() causa que
 * la cookie expire en 1970 (porque new Date(durationInMs) lo interpreta como
 * un timestamp absoluto en 1970).
 *
 * Uso: `await setCookieWithDuration(name, value, COOKIE_CONFIG.EXPIRY_MS)`
 */
export async function setCookieWithDuration(name, value, durationMs) {
  return setCookie(name, value, Date.now() + durationMs);
}

/**
 * Borra una cookie del navegador y del fallback en memoria.
 *
 * @param {string} name Nombre de la cookie.
 * @returns {Promise<void>}
 */
export async function deleteCookie(name) {
  try {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  } catch (cookieWriteBlocked) {
    // El browser deniega la escritura: el fallback en memoria se limpia igual.
  }
  cookieMemoryFallback.delete(name);
}

/**
 * Lee una cookie directamente de `document.cookie`.
 *
 * @param {string} name Nombre de la cookie.
 * @returns {string|null} El valor decodificado, o `null` si no está o si el
 *   browser no permite leer cookies.
 */
function readCookieFromDocument(name) {
  try {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
  } catch (cookieReadBlocked) {
    return null;
  }
}
