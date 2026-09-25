/**
 * Detecta browsers con bugs conocidos en multipart/form-data POST vía fetch().
 * Usado por useReciboUpload para elegir retry config más agresiva y por HttpApi
 * para decidir entre fetch y XMLHttpRequest en uploads.
 *
 * Patrones cubiertos (production-validated 2026-09-22 caso Ferrufino + otros):
 *  - Samsung Internet: SamsungBrowser/
 *  - UC Browser: UCBrowser/ | UCWEB
 *  - Xiaomi MIUI Browser: MiuiBrowser/ | XiaoMi/MiuiBrowser
 *  - Huawei Browser: HuaweiBrowser/ | HBrowser/
 *  - WhatsApp in-app (Android): WA4A | FBAN
 *  - Facebook in-app: FB_IAB | FBAV
 *  - Instagram in-app: Instagram <version>
 *  - Android legacy (5-8): WebView pre-Chromium
 *
 * Excluye Android 4.x: <1% market share en 2026 (Statcounter).
 */
const FRAGILE_BROWSER_PATTERNS = [
  /SamsungBrowser/,
  /UCBrowser|UCWEB/,
  /MiuiBrowser|XiaoMi\/MiuiBrowser/,
  /HuaweiBrowser|HBrowser/,
  /WA4A|FBAN/,
  /FB_IAB|FBAV/,
  /Instagram [\d.]+/,
];
const ANDROID_LEGACY_PATTERN = /Android [5-8]\.\d+/;

/**
 * @returns {boolean} true si el browser actual tiene bugs conocidos con multipart upload
 */
export const isFragileUploadBrowser = () => {
  if (typeof navigator === "undefined" || !navigator.userAgent) return false;
  const ua = navigator.userAgent;
  if (FRAGILE_BROWSER_PATTERNS.some((re) => re.test(ua))) return true;
  if (ANDROID_LEGACY_PATTERN.test(ua)) return true;
  return false;
};