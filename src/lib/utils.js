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
export async function getCookie(name) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export async function setCookie(name, value, expires) {
  const expiresStr = new Date(expires).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expiresStr}; path=/`;
}

/**
 * Helper para evitar que el call-site olvide sumar Date.now() a una duración.
 * Pasa directamente la duración (en ms) a setCookie; el wrapper hace el
 * `Date.now() + durationMs` por vos. Sin esto, olvidar Date.now() causa que
 * la cookie expire en 1970 (porque new Date(durationEnMs) lo interpreta como
 * un timestamp absoluto en 1970).
 *
 * Uso: `await setCookieWithDuration(name, value, COOKIE_CONFIG.EXPIRY_MS)`
 */
export async function setCookieWithDuration(name, value, durationMs) {
  return setCookie(name, value, Date.now() + durationMs);
}

export async function deleteCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
}
