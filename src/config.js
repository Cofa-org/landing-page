const VITE_COFA_AUTH_URL =
  import.meta.env.VITE_COFA_AUTH_URL || "";

const VITE_COFA_AUTH_API_KEY =
  import.meta.env.VITE_COFA_AUTH_API_KEY || "";

const VITE_COFA_AUTH_EMAIL = import.meta.env.COFA_AUTH_EMAIL || "";
const VITE_COFA_AUTH_PASS = import.meta.env.COFA_AUTH_PASS || "";

const VITE_URL_LOCAL = import.meta.env.VITE_URL_LOCAL;

export {
  VITE_COFA_AUTH_URL,
  VITE_COFA_AUTH_API_KEY,
  VITE_URL_LOCAL,
  VITE_COFA_AUTH_EMAIL,
  VITE_COFA_AUTH_PASS,
};
