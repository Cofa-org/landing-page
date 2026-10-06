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
  /**
   * Iter 1: Resuelve identidades AFIP para un DNI.
   * Devuelve { identities, existingClient: { maskedEmail, alreadyRegistered, verified }|null }
   */
  resolveDni: (dni, turnstileToken) =>
    authFetch("/dni/resolve", { body: { dni, turnstileToken } }),

  /**
   * Iter 1: Registro de cliente existente (email determinado por CUIT, no ingresado por usuario).
   * Devuelve { maskedEmail, email } — email se usa internamente para el paso OTP.
   */
  registerExistingClient: (cuit, password, turnstileToken) =>
    authFetch("/register-existing-client", { body: { cuit, password, turnstileToken } }),

  /** Crea la cuenta. Respuesta genérica (anti-enumeration). */
  register: (email, password, turnstileToken, cuit = null) =>
    authFetch("/register", { body: { email, password, turnstileToken, ...(cuit ? { cuit } : {}) } }),

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

  /** Devuelve perfil de sesión: email, nombreCompleto, dni, fechaCreacion, fechaNacimiento, domicilio. */
  me: () => authFetch("/me", { method: "GET" }),

  /** Solicita link de reset. Respuesta siempre genérica (anti-enumeration). */
  forgotPassword: (email, turnstileToken) =>
    authFetch("/password/forgot", { body: { email, turnstileToken } }),

  /** Token del link + nueva contraseña → actualiza y revoca sesiones. */
  resetPassword: (token, newPassword, turnstileToken) =>
    authFetch("/password/reset", { body: { token, newPassword, turnstileToken } }),

  /**
   * Devuelve { solicitudes, tieneHistorial } del usuario autenticado.
   * Si no tiene lead vinculado, solicitudes = [] y tieneHistorial = false.
   */
  getSolicitudes: () => authFetch("/solicitudes", { method: "GET" }),

  /**
   * Historial de préstamos en SB del usuario autenticado.
   * Devuelve { esCliente, prestamos: [{ id, estado, capital, cuota, plazo, fecha }] }.
   * Si no es cliente o SB no responde, prestamos = [].
   */
  getPrestamos: () => authFetch("/prestamos", { method: "GET" }),

  /**
   * Iter 2: Retoma una solicitud incompleta desde la sesión autenticada.
   * Devuelve { success, data: { leadToken, leadId, es_cliente, celular, maxSlots, estadoOnboarding } }
   */
  resumeSolicitud: (solicitudId = null) =>
    authFetch("/solicitudes/resume", {
      body: solicitudId != null ? { solicitudId } : {},
    }),

  /** Cambia la contraseña desde el perfil (requiere contraseña actual). */
  changePassword: (currentPassword, newPassword) =>
    authFetch("/profile/password", { body: { currentPassword, newPassword } }),

  /**
   * Paso 1 del cambio de email: verifica contraseña y envía OTP al nuevo email.
   */
  requestEmailChange: (currentPassword, newEmail) =>
    authFetch("/profile/email/request", { body: { currentPassword, newEmail } }),

  /**
   * Paso 2 del cambio de email: confirma con el OTP recibido en el nuevo email.
   */
  confirmEmailChange: (code) =>
    authFetch("/profile/email/confirm", { body: { code } }),
};

export default authService;
