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

// VITE_DEV: feature flag dev/staging expuesto vía env var. Default false.
// Usar `parseBool` es crítico — `import.meta.env.VITE_DEV` es un STRING
// (`"true"`/`"false"`/`undefined`); sin parseo, `"false"` se evalúa como
// truthy (string no vacío) y el panel se mostraría aunque el operador
// pusiera false a propósito.
const DEV = parseBool(import.meta.env.VITE_DEV);

// VITE_ENABLE_TEST_PERSONAS: flag global del feature (single source of
// truth del backend vía ENABLE_TEST_PERSONAS, espejado acá para que el
// front pueda cortocircuitar fetch antes de pegarle al back).
// Misma trampa que VITE_DEV — sin parseBool, "false" es truthy.
const ENABLE_TEST_PERSONAS = parseBool(import.meta.env.VITE_ENABLE_TEST_PERSONAS);

/**
 * Gate del panel de personas-test. Habilita la UI cuando Vite está en
 * modo dev (`VITE_DEV === true`) o cuando la URL trae `?testMode=1`
 * (para que el operador pueda abrir el panel en un build de staging
 * sin `VITE_DEV=true`). Las dos condiciones son OR — cualquiera de las
 * dos activa la UI.
 *
 * Centralizada acá para que `TestSimuladorPanel.jsx` y el hook
 * `useTestSimuladorPanel.js` no dupliquen el patrón y se desincronicen.
 *
 * Para usages donde SOLO importa el build-time (sin OR con queryParam,
 * ej. el gate de seguridad del POST de reset NORIEGA en
 * useTestSimuladorPanel.js:98, o el log verbose de useMobbexSubscription),
 * usar el constant `DEV` de este archivo: ya parseado y consistente
 * con el resto del feature.
 *
 * @returns {boolean}
 */
function isTestPersonasVisible() {
  return DEV || new URLSearchParams(window.location.search).get("testMode") === "1";
}

export {
  LANDING_BACKEND_URL,
  LANDING_BACKEND_API_KEY,
  LRS_URL,
  LRS_API_KEY,
  TURNSTILE_SITE_KEY,
  THUMBMARKJS_API_KEY,
  SISTEMA_FRANCES_ON,
  DEV,
  ENABLE_TEST_PERSONAS,
  parseBool,
  isTestPersonasVisible,
};