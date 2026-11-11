import { LANDING_BACKEND_URL, LANDING_BACKEND_API_KEY } from "../config";
import { DNI_ROTATIONS } from "../constants/dni.constants.js";
import { assertDniPng, dniError, normalizeDniError, normalizeDniId, validDniContext, validDniUuid } from "../lib/dni-capture.js";
import { HTTP_METHOD } from "../constants/HTTP_METHODS.js";
import { HttpApi } from "../lib/http.js";
import { parseErrorResponse } from "../lib/http-error.js";
import { getCookie } from "../lib/utils";
import { COOKIE_LEAD_TOKEN_CONFIG } from "../constants/LOAN_SIM.js";

export default class LeadRegistrationService {

  static async crearLead(
    { dni, turnstileToken, celular, selectedCuit, term_y_cond, situacion_laboral, fecha_nacimiento, prevencion_fraudes },
    signal = null,
  ) {
    try {
      const url = `${LANDING_BACKEND_URL}/api/lead-registration/crear`;
      const body = {
        dni,
        turnstileToken,
        celular,
        selectedCuit,
        term_y_cond,
        situacion_laboral,
        prevencion_fraudes,
        fecha_nacimiento,
      };
      const response = await HttpApi(
        url,
        body,
        HTTP_METHOD.POST,
        LANDING_BACKEND_API_KEY,
        null,
        signal,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const err = new Error(errorData.message || "Error al registrar el lead");
        if (errorData.cause) err.cause = errorData.cause;
        throw err;
      }

      return await response.json();
    } catch (error) {
      console.error("LEAD_REGISTRATION_SERVICE_ERROR:", error);
      throw error;
    }
  }

  static async obtenerContextoDni(leadId, { tokenOverride, signal = null } = {}) {
    if (!normalizeDniId(leadId)) throw dniError("DNI_CAPTURE_INVALID_INPUT");
    try {
      const token = tokenOverride ?? await getCookie(COOKIE_LEAD_TOKEN_CONFIG.NAME);
      const response = await HttpApi(
        `${LANDING_BACKEND_URL}/api/lead-registration/dni-contexto/${leadId}`,
        null, HTTP_METHOD.GET, LANDING_BACKEND_API_KEY, token, signal,
      );
      return await readDniResponse(response);
    } catch (error) {
      throw normalizeDniError(error);
    }
  }

  static async subirDni({ leadId }, files, signal = null, retryConfig = null, options = {}) {
    // Keep the legacy positional argument; DNI retries require an explicit action.
    void retryConfig;
    const token = options.tokenOverride ?? await getCookie(COOKIE_LEAD_TOKEN_CONFIG.NAME);
    return uploadDni(leadId, files, token, signal, options);
  }

  static async subirDniMobile({ leadId }, files, tokenOverride, signal = null, retryConfig = null, options = {}) {
    // Keep the legacy positional argument; DNI retries require an explicit action.
    void retryConfig;
    return uploadDni(leadId, files, tokenOverride, signal, options);
  }
  static async subirRecibos({ leadId }, filesByOrden, signal = null, retryConfig = null) {
    try {
      const url = `${LANDING_BACKEND_URL}/api/lead-registration/subir-recibos/${leadId}`;
      const token = await getCookie(COOKIE_LEAD_TOKEN_CONFIG.NAME);
      const formData = new FormData();
      const ordenes = [];
      for (const orden of Object.keys(filesByOrden).sort((a, b) => Number(a) - Number(b))) {
        const file = filesByOrden[orden];
        if (!file) continue;
        formData.append("files", file);
        formData.append("orden", String(orden));
        ordenes.push(orden);
      }
      if (ordenes.length === 0) {
        throw new Error("Al menos un recibo es requerido");
      }
      const response = await HttpApi(
        url,
        formData,
        HTTP_METHOD.POST,
        LANDING_BACKEND_API_KEY,
        token,
        signal,
        retryConfig,
      );
      const data = await response.json();
      if (!response.ok) {
        const err = new Error(data.message || "Error al subir los recibos");
        if (data.cause) err.cause = data.cause;
        throw err;
      }
      return data;
    } catch (error) {
      console.error("SUBIR_RECIBOS_SERVICE_ERROR:", error);
      throw error;
    }
  }

  static async getRecibosPendientes(leadId, signal = null) {
    try {
      const url = `${LANDING_BACKEND_URL}/api/lead-registration/${leadId}/recibos-pendientes`;
      const token = await getCookie(COOKIE_LEAD_TOKEN_CONFIG.NAME);
      const response = await HttpApi(
        url,
        null,
        HTTP_METHOD.GET,
        LANDING_BACKEND_API_KEY,
        token,
        signal,
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Error al obtener los recibos pendientes");
      }
      return data.data || [];
    } catch (error) {
      console.error("GET_RECIBOS_PENDIENTES_ERROR:", error);
      throw error;
    }
  }

  static async obtenerEstadoOnboarding(leadId, signal = null) {
    try {
      const url = `${LANDING_BACKEND_URL}/api/lead-registration/${leadId}/estado`;
      const token = await getCookie(COOKIE_LEAD_TOKEN_CONFIG.NAME);
      const response = await HttpApi(
        url,
        null,
        HTTP_METHOD.GET,
        LANDING_BACKEND_API_KEY,
        token,
        signal,
      );

      if (!response.ok) {
        const failure = await parseErrorResponse(response);
        throw Object.assign(new Error(failure.message || "Error al obtener el estado del lead"), {
          status: failure.status,
          cause: failure.cause,
        });
      }
      const data = await response.json();
      if (data.success === false) {
        throw Object.assign(new Error(data.message || "Error al obtener el estado del lead"), {
          status: data.status,
          cause: data.cause,
        });
      }
      return data;
    } catch (error) {
      console.error("OBTENER_ESTADO_ONBOARDING_ERROR:", error);
      throw error;
    }
  }

  static async actualizarEstadoOnboarding({ leadId, estado }, signal = null) {
    try {
      const url = `${LANDING_BACKEND_URL}/api/lead-registration/actualizar-estado`;
      const token = await getCookie(COOKIE_LEAD_TOKEN_CONFIG.NAME);
      const body = { leadId, estado };
      const response = await HttpApi(
        url,
        body,
        HTTP_METHOD.PUT,
        LANDING_BACKEND_API_KEY,
        token,
        signal,
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Error al actualizar estado de onboarding");
      }
      return data;
    } catch (error) {
      console.error("ACTUALIZAR_ESTADO_ONBOARDING_ERROR:", error);
      throw error;
    }
  }

  static async obtenerLead(leadId, signal = null) {
    try {
      const url = `${LANDING_BACKEND_URL}/api/lead-registration/${leadId}`;
      const token = await getCookie(COOKIE_LEAD_TOKEN_CONFIG.NAME);
      const response = await HttpApi(
        url,
        null,
        HTTP_METHOD.GET,
        LANDING_BACKEND_API_KEY,
        token,
        signal,
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Error al obtener el lead");
      }
      return data;
    } catch (error) {
      console.error("OBTENER_LEAD_ERROR:", error);
      throw error;
    }
  }

  static async onBoardingCompleto(leadId, signal = null) {
    try {
      const url = `${LANDING_BACKEND_URL}/api/lead-registration/${leadId}/completo`;
      const token = await getCookie(COOKIE_LEAD_TOKEN_CONFIG.NAME);
      const response = await HttpApi(
        url,
        null,
        HTTP_METHOD.POST,
        LANDING_BACKEND_API_KEY,
        token,
        signal,
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Error al marcar onboarding como completo");
      }
      return data;
    } catch (error) {
      console.error("ONBOARDING_COMPLETO_ERROR:", error);
      throw error;
    }
  }

  static async solicitarOTPCelular({ leadId, celular }, signal = null) {
    try {
      const url = `${LANDING_BACKEND_URL}/api/lead-registration/solicitar-otp-celular`;
      const token = await getCookie(COOKIE_LEAD_TOKEN_CONFIG.NAME);
      const body = { celular };
      const response = await HttpApi(
        url,
        body,
        HTTP_METHOD.POST,
        LANDING_BACKEND_API_KEY,
        token,
        signal,
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Error al solicitar OTP de celular");
      }
      return data;
    } catch (error) {
      console.error("SOLICITAR_OTP_CELULAR_SERVICE_ERROR:", error);
      throw error;
    }
  }

  static async verificarOTPCelular({ leadId, codigo, huella_dispositivo, requestId }, signal = null) {
    try {
      const url = `${LANDING_BACKEND_URL}/api/lead-registration/verificar-otp-celular`;
      const token = await getCookie(COOKIE_LEAD_TOKEN_CONFIG.NAME);
      const body = { codigo, huella_dispositivo, request_id: requestId };
      const response = await HttpApi(
        url,
        body,
        HTTP_METHOD.POST,
        LANDING_BACKEND_API_KEY,
        token,
        signal,
      );
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Error al verificar OTP de celular");
      }
      return data;
    } catch (error) {
      console.error("VERIFICAR_OTP_CELULAR_SERVICE_ERROR:", error);
      throw error;
    }
  }

  // Plan 2026-09-29 (cliente email OTP): re-envía un código OTP al email del
  // cliente COFA (`cliente.Email` de SB). El `leadId` se lee del JWT (el back
  // no lo necesita en el body). El email se resuelve internamente.
  static async solicitarOTPEmail(_args = {}, signal = null) {
    try {
      const url = `${LANDING_BACKEND_URL}/api/lead-registration/solicitar-otp-email`;
      const token = await getCookie(COOKIE_LEAD_TOKEN_CONFIG.NAME);
      const response = await HttpApi(
        url,
        {},
        HTTP_METHOD.POST,
        LANDING_BACKEND_API_KEY,
        token,
        signal,
      );
      if (!response.ok) {
        const failure = await parseErrorResponse(response);
        throw Object.assign(new Error(failure.message || "Error al solicitar OTP de email"), {
          status: failure.status,
          cause: failure.cause ?? undefined,
        });
      }
      const data = await response.json();
      if (data.success === false) {
        throw Object.assign(new Error(data.message || "Error al solicitar OTP de email"), {
          status: data.status,
          cause: data.cause,
        });
      }
      return data;
    } catch (error) {
      console.error("SOLICITAR_OTP_EMAIL_SERVICE_ERROR:", error);
      throw error;
    }
  }

  // Plan 2026-09-29 (cliente email OTP): valida el código OTP tipeado por el
  // usuario tras el post-pick del picker. Devuelve `data.estado_onboarding`
  // (CELULAR_VALIDADO) en match.
  static async verificarOTPEmail({ codigo }, signal = null) {
    try {
      const url = `${LANDING_BACKEND_URL}/api/lead-registration/verificar-otp-email`;
      const token = await getCookie(COOKIE_LEAD_TOKEN_CONFIG.NAME);
      const body = { codigo };
      const response = await HttpApi(
        url,
        body,
        HTTP_METHOD.POST,
        LANDING_BACKEND_API_KEY,
        token,
        signal,
      );
      if (!response.ok) {
        const failure = await parseErrorResponse(response);
        throw Object.assign(new Error(failure.message || "Error al verificar OTP de email"), {
          status: failure.status,
          cause: failure.cause ?? undefined,
        });
      }
      const data = await response.json();
      if (data.success === false) {
        throw Object.assign(new Error(data.message || "Error al verificar OTP de email"), {
          status: data.status,
          cause: data.cause,
        });
      }
      return data;
    } catch (error) {
      console.error("VERIFICAR_OTP_EMAIL_SERVICE_ERROR:", error);
      throw error;
    }
  }

  static async phonePickerPick({ opcionElegida }, signal = null) {
    try {
      const url = `${LANDING_BACKEND_URL}/api/lead-registration/phone-picker-pick`;
      const token = await getCookie(COOKIE_LEAD_TOKEN_CONFIG.NAME);
      const body = { opcionElegida };
      const response = await HttpApi(
        url,
        body,
        HTTP_METHOD.POST,
        LANDING_BACKEND_API_KEY,
        token,
        signal,
      );

      const data = await response.json();
      if (!response.ok) {
        const err = new Error(data.message || "Error al validar teléfono");
        if (data.cause) err.cause = data.cause;
        throw err;
      }
      return data;
    } catch (error) {
      console.error("PHONE_PICKER_PICK_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Inicia la sesión de un lead desde un enlace de resubida.
   *
   * El front consume primero el shortId vía `LinkResolutionService.consumeLink`
   * y obtiene `leadId`; luego llama a este método, que POSTea
   * `/api/lead-registration/resume-init` con `{ leadId, shortId }` y devuelve:
   *   - `data.leadToken`  (JWT para setear en cookie)
   *   - `data.leadId`
   *   - `data.es_cliente`
   *   - `data.celular`
   *   - `data.maxSlots`   (default 3; el back puede aumentarlo si el operador
   *                        requirió recibos extra — ver spec
   *                        "Recibo resubida operador" 2026-09-07).
   *
   * El back siempre responde HTTP 200; el rechazo viene en el body con
   * `success: false` + `cause`. Si `response.ok === false` (red/auth fail)
   * propagamos un Error con `cause` cuando esté disponible.
   */
  static async iniciarSesionResume({ leadId, shortId }, signal = null) {
    try {
      const url = `${LANDING_BACKEND_URL}/api/lead-registration/resume-init`;
      const response = await HttpApi(
        url,
        { leadId, shortId },
        HTTP_METHOD.POST,
        LANDING_BACKEND_API_KEY,
        null,
        signal,
      );
      const data = await response.json();
      if (!response.ok) {
        const err = new Error(data.message || "Error al iniciar sesión de resume");
        if (data.cause) err.cause = data.cause;
        throw err;
      }
      return data;
    } catch (error) {
      console.error("RESUME_INIT_SERVICE_ERROR:", error);
      throw error;
    }
  }
}

async function readDniResponse(response) {
  let body;
  try { body = await response.json(); } catch { throw dniError("DNI_TECHNICAL_ERROR"); }
  if (!response.ok || body?.success === false) {
    const status = response.status === 200 && body?.success === false ? body.status : response.status;
    if (!Number.isInteger(status) || status < 400 || status > 599) throw dniError("DNI_TECHNICAL_ERROR");
    throw normalizeDniError({ cause: body?.cause, status, data: { side: body?.data?.side } });
  }
  if (body?.success !== true || !body.data || typeof body.data !== "object") throw dniError("DNI_TECHNICAL_ERROR");
  return body;
}

async function uploadDni(leadId, { dniFront, dniBack }, token, signal, options) {
  if (!validDniContext(options.context)) throw dniError("DNI_CAPTURE_CONTEXT_REQUIRED");
  if (!normalizeDniId(leadId) || !validDniUuid(options.uploadId)
    || !DNI_ROTATIONS.includes(options.rotationFront) || !DNI_ROTATIONS.includes(options.rotationBack)) {
    throw dniError("DNI_CAPTURE_INVALID_INPUT");
  }
  assertDniPng(dniFront);
  assertDniPng(dniBack);
  const form = new FormData();
  form.append("dniFront", dniFront, "dni-front.png");
  form.append("dniBack", dniBack, "dni-back.png");
  for (const field of ["solicitudId", "captureSessionId", "baseRevision"]) form.append(field, options.context[field]);
  form.append("uploadId", options.uploadId);
  form.append("rotationFront", String(options.rotationFront));
  form.append("rotationBack", String(options.rotationBack));
  try {
    const response = await HttpApi(
      `${LANDING_BACKEND_URL}/api/lead-registration/subir-dni/${leadId}`,
      form, HTTP_METHOD.POST, LANDING_BACKEND_API_KEY, token, signal,
      { retries: 0, timeoutMs: 90000 },
    );
    return await readDniResponse(response);
  } catch (error) {
    throw normalizeDniError(error);
  }
}
