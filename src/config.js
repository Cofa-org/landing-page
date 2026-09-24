// Parsea un string truthy/falsy a boolean real (Vite pasa env vars como strings).
// Acepta: "true"/"1" → true, "false"/"0" → false, undefined/otro → fallback (default false).
const parseBool = (raw, fallback = false) => {
  if (raw == null) return fallback;
  const v = String(raw).trim().toLowerCase();
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return fallback;
};

const LANDING_BACKEND_URL = import.meta.env.VITE_LANDING_BACKEND_URL;
const LANDING_BACKEND_API_KEY = import.meta.env.VITE_LANDING_BACKEND_API_KEY;
const LRS_URL = import.meta.env.VITE_LRS_URL;
const LRS_API_KEY = import.meta.env.VITE_LRS_API_KEY;
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const THUMBMARKJS_API_KEY = import.meta.env.VITE_THUMBMARKJS_API_KEY;
// SISTEMA_FRANCES_ON: feature flag para el sistema francés nuevo.
// Default false → comportamiento legacy pre-merge.
// Rollback sin redeploy: VITE_SISTEMA_FRANCES_ON=false.
const SISTEMA_FRANCES_ON = parseBool(import.meta.env.VITE_SISTEMA_FRANCES_ON);

/**
 * Gate del panel de personas-test. Habilita la UI cuando Vite está en
 * modo dev (`import.meta.env.DEV === true`) o cuando la URL trae
 * `?testMode=1` (para que el operador pueda abrir el panel en un build
 * de staging sin `DEV=true`). Las dos condiciones son OR — cualquiera
 * de las dos activa la UI.
 *
 * Centralizada acá para que `TestSimuladorPanel.jsx` y el hook
 * `useTestSimuladorPanel.js` no dupliquen el patrón y se desincronicen.
 *
 * Para usages donde SOLO importa el build-time (sin OR con queryParam,
 * ej. el gate de seguridad del POST de reset NORIEGA en
 * useTestSimuladorPanel.js:98, o el log verbose de useMobbexSubscription),
 * usar `import.meta.env.DEV` directo: Vite lo reemplaza por un
 * literal `true`/`false` en build, sin dependencia de env vars.
 * Mover esos usages a este helper introduce el riesgo de "olvidé
 * setear VITE_DEV=true en .env".
 *
 * @returns {boolean}
 */
function isTestPersonasVisible() {
  console.log("DEBUG: isTestPersonasVisible", import.meta.env.VITE_DEV, window.location.search);
  return import.meta.env.VITE_DEV || new URLSearchParams(window.location.search).get("testMode") === "1";
}

export {
  LANDING_BACKEND_URL,
  LANDING_BACKEND_API_KEY,
  LRS_URL,
  LRS_API_KEY,
  TURNSTILE_SITE_KEY,
  THUMBMARKJS_API_KEY,
  SISTEMA_FRANCES_ON,
  parseBool,
  isTestPersonasVisible,
};