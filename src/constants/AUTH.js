// OTP de email de las pantallas de auth. Onboarding y simulador usan OTP_CONFIG de LOAN_SIM.js.
export const AUTH_OTP_CONFIG = {
  RESEND_COOLDOWN_SECONDS: 60, // mismo valor que AUTH_OTP_CONFIG.RESEND_COOLDOWN_MS del back
};

export const AUTH_SESSION_CONFIG = {
  IDLE_MS: 30 * 60 * 1000, // mismo valor que AUTH_SESSION_IDLE_MS del back
  EXPIRED_MESSAGE: "Tu sesión venció. Ingresá de nuevo.",
};

// Eventos de window que emite authService y escucha AuthContext.
export const AUTH_SESSION_EVENT = {
  ACTIVITY: "cofa:auth-activity",
  EXPIRED: "cofa:auth-session-expired",
};

export const AUTH_SESSION_CAUSE = {
  REQUIRED: "AUTH_SESSION_REQUIRED", // sin cookie
  INVALID: "AUTH_SESSION_INVALID", // cookie de una sesión vencida o revocada
};

export const AUTH_SESSION_ERROR_CAUSES = Object.values(AUTH_SESSION_CAUSE);
