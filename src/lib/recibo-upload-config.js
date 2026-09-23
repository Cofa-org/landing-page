import { isFragileUploadBrowser } from "./fragile-upload-browsers";

/**
 * Retry config para `subirRecibos` cuando el browser NO tiene bugs conocidos
 * con multipart/form-data POST. Defaults seguros (backoff corto, 60s timeout).
 */
export const SUBIR_RECIBOS_RETRY_CONFIG_BASE = {
  retries: 1,
  backoffMs: 1500,
  timeoutMs: 60000,
};

/**
 * Retry config para `subirRecibos` cuando el browser SÍ tiene bugs conocidos
 * (Samsung Internet, WhatsApp/Facebook/Instagram in-app, UC, MIUI, Huawei,
 * Android 5-8). Más retries + backoff mayor + timeout más largo para
 * dar tiempo a que el multipart upload se complete o reintentar antes
 * del timeout interno del browser.
 */
export const SUBIR_RECIBOS_RETRY_CONFIG_FRAGILE = {
  retries: 3,
  backoffMs: 3000,
  timeoutMs: 90000,
};

/**
 * Selector de retry config basado en el browser actual. Llamar por cada
 * upload para reflejar el UA vigente (no cachear en module-level para
 * mantener simple; el costo es despreciable).
 *
 * @returns {Object} config con `retries`, `backoffMs`, `timeoutMs`
 */
export const getSubirRecibosRetryConfig = () =>
  isFragileUploadBrowser() ? SUBIR_RECIBOS_RETRY_CONFIG_FRAGILE : SUBIR_RECIBOS_RETRY_CONFIG_BASE;
