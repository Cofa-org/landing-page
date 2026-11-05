/**
 * Acceso defensivo a `localStorage`.
 *
 * Chromium lanza `SecurityError: Failed to read the 'localStorage' property
 * from 'Window': Access is denied for this document.` cuando el documento no
 * tiene acceso al storage del sitio: cookies de terceros bloqueadas,
 * "Bloquear todas las cookies y los datos de sitios", origen opaco (iframe
 * con `sandbox` sin `allow-same-origin`), o un WebView con
 * `domStorageEnabled = false`.
 *
 * El error se produce al LEER la propiedad `window.localStorage`, no al
 * llamar a `getItem()`: por eso una guarda `typeof window !== "undefined"`
 * no alcanza — `window` existe, lo que falla es la propiedad. Estos helpers
 * encapsulan la guarda para que ninguna lectura pueda abortar la request que
 * la usa.
 *
 * Devuelven `null` en vez de propagar la excepción: la ausencia de un valor
 * persistido degrada el feature que lo consume (no se manda un header
 * opcional, no se restaura un cooldown) sin romper el flujo.
 */

/**
 * Lee una clave de `localStorage` sin propagar la excepción de acceso.
 *
 * @param {string} key Clave a leer.
 * @returns {string|null} El valor persistido, o `null` si no existe o si el
 *   browser deniega el acceso a `localStorage`.
 */
export function safeGetLocalStorageItem(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Escribe una clave en `localStorage` sin propagar la excepción de acceso.
 *
 * @param {string} key Clave a escribir.
 * @param {string} value Valor a persistir.
 * @returns {void}
 */
export function safeSetLocalStorageItem(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // El browser deniega el acceso: el valor no se persiste y el feature que
    // lo consume sigue funcionando con su valor por defecto.
  }
}

/**
 * Borra una clave de `localStorage` sin propagar la excepción de acceso.
 *
 * @param {string} key Clave a borrar.
 * @returns {void}
 */
export function safeRemoveLocalStorageItem(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // El browser deniega el acceso: no había nada persistido que borrar.
  }
}
