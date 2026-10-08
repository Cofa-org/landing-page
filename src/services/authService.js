import { LANDING_BACKEND_URL, LANDING_BACKEND_API_KEY } from "../config";
import { HTTP_METHOD } from "../constants/HTTP_METHODS.js";
import { HttpApi } from "../lib/http.js";

const BASE = `${LANDING_BACKEND_URL}/api/auth`;

async function authRequest(path, { method = HTTP_METHOD.POST, body, signal } = {}) {
  try {
    const response = await HttpApi(
      `${BASE}${path}`,
      body ?? null,
      method,
      LANDING_BACKEND_API_KEY,
      null,
      signal,
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.success === false) {
      const err = new Error(data.message || "Error de autenticación");
      if (data.cause) err.cause = data.cause;
      throw err;
    }

    return data;
  } catch (err) {
    console.error("AUTH_SERVICE_ERROR:", err.cause || err.message);
    throw err;
  }
}

export default class AuthService {

  static resolveDni(dni, turnstileToken, signal) {
    return authRequest("/dni/resolve", { body: { dni, turnstileToken }, signal });
  }

  static registerExistingClient(cuit, password, turnstileToken, signal) {
    return authRequest("/register-existing-client", {
      body: { cuit, password, turnstileToken },
      signal,
    });
  }

  static register(email, password, turnstileToken, cuit = null, signal) {
    return authRequest("/register", {
      body: { email, password, turnstileToken, ...(cuit ? { cuit } : {}) },
      signal,
    });
  }

  static verifyEmail(email, code, turnstileToken, signal) {
    return authRequest("/verify-email", { body: { email, code, turnstileToken }, signal });
  }

  static resendOtp(email, turnstileToken, signal) {
    return authRequest("/resend-otp", { body: { email, turnstileToken }, signal });
  }

  static login(email, password, turnstileToken, signal) {
    return authRequest("/login", { body: { email, password, turnstileToken }, signal });
  }

  static logout(signal) {
    return authRequest("/logout", { signal });
  }

  static me(signal) {
    return authRequest("/me", { method: HTTP_METHOD.GET, signal });
  }

  static forgotPassword(email, turnstileToken, signal) {
    return authRequest("/password/forgot", { body: { email, turnstileToken }, signal });
  }

  static resetPassword(token, newPassword, turnstileToken, signal) {
    return authRequest("/password/reset", {
      body: { token, newPassword, turnstileToken },
      signal,
    });
  }

  static getSolicitudes(signal) {
    return authRequest("/solicitudes", { method: HTTP_METHOD.GET, signal });
  }

  static getPrestamos(signal) {
    return authRequest("/prestamos", { method: HTTP_METHOD.GET, signal });
  }

  static resumeSolicitud(solicitudId = null, signal) {
    return authRequest("/solicitudes/resume", {
      body: solicitudId != null ? { solicitudId } : {},
      signal,
    });
  }

  static changePassword(currentPassword, newPassword, signal) {
    return authRequest("/profile/password", {
      body: { currentPassword, newPassword },
      signal,
    });
  }

  static requestEmailChange(currentPassword, newEmail, signal) {
    return authRequest("/profile/email/request", {
      body: { currentPassword, newEmail },
      signal,
    });
  }

  static confirmEmailChange(code, signal) {
    return authRequest("/profile/email/confirm", { body: { code }, signal });
  }
}
