import { LANDING_BACKEND_URL, LANDING_BACKEND_API_KEY } from "../config";

const BASE = `${LANDING_BACKEND_URL}/api/auth`;

/**
 * Fetch wrapper para el módulo auth.
 * - Siempre usa credentials: "include" para que el browser envíe/reciba la
 *   cookie HttpOnly de sesión (cofa_auth).
 * - Lanza un Error con la propiedad `cause` que viene del backend para que
 *   los screens puedan distinguir casos (AUTH_LOGIN_FAILED, etc.).
 */
async function authFetch(path, { method = "POST", body } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers: {
      "x-api-key": LANDING_BACKEND_API_KEY,
      ...(body !== undefined && { "Content-Type": "application/json" }),
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });

  const data = await response.json().catch(() => ({}));

  // El backend siempre devuelve HTTP 200; el resultado real está en data.success.
  // response.ok también sirve como fallback para errores de red inesperados.
  if (!response.ok || data.success === false) {
    const err = new Error(data.message || "Error de autenticación");
    if (data.cause) err.cause = data.cause;
    throw err;
  }

  return data;
}

const authService = {
  /** Crea la cuenta. Respuesta genérica (anti-enumeration). */
  register: (email, password, turnstileToken) =>
    authFetch("/register", { body: { email, password, turnstileToken } }),

  /** Verifica el email con el código OTP de 6 dígitos del registro. */
  verifyEmail: (email, code, turnstileToken) =>
    authFetch("/verify-email", { body: { email, code, turnstileToken } }),

  /** Reenvía el OTP de registro. Respuesta genérica (anti-enumeration). */
  resendOtp: (email, turnstileToken) =>
    authFetch("/resend-otp", { body: { email, turnstileToken } }),

  /** Email + password → cookie HttpOnly cofa_auth. */
  login: (email, password, turnstileToken) =>
    authFetch("/login", { body: { email, password, turnstileToken } }),

  /** Revoca la sesión y limpia la cookie. */
  logout: () => authFetch("/logout"),

  /** Devuelve { email, emailVerified, leadId } si la sesión es válida. */
  me: () => authFetch("/me", { method: "GET" }),

  /** Solicita link de reset. Respuesta siempre genérica (anti-enumeration). */
  forgotPassword: (email, turnstileToken) =>
    authFetch("/password/forgot", { body: { email, turnstileToken } }),

  /** Token del link + nueva contraseña → actualiza y revoca sesiones. */
  resetPassword: (token, newPassword, turnstileToken) =>
    authFetch("/password/reset", { body: { token, newPassword, turnstileToken } }),
};

export default authService;
