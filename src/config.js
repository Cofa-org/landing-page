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

export {
  LANDING_BACKEND_URL,
  LANDING_BACKEND_API_KEY,
  LRS_URL,
  LRS_API_KEY,
  TURNSTILE_SITE_KEY,
  THUMBMARKJS_API_KEY,
  SISTEMA_FRANCES_ON,
  parseBool,
};