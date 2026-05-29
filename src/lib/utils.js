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

// Cookie helpers with fallback to document.cookie for unsupported browsers
const hasCookieStore = typeof window !== "undefined" && typeof window.cookieStore !== "undefined";

export async function getCookie(name) {
  if (hasCookieStore) {
    const cookie = await window.cookieStore.get(name);
    return cookie?.value ?? null;
  }
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export async function setCookie(name, value, expires) {

  if (hasCookieStore) {
    await window.cookieStore.set({ name, value, expires });
    return;
  }
  const expiresStr = new Date(expires).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expiresStr}; path=/`;
}

export async function deleteCookie(name) {
  if (hasCookieStore) {
    await window.cookieStore.delete(name);
    return;
  }
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
}
