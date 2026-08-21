import { LANDING_BACKEND_URL, LANDING_BACKEND_API_KEY } from "../config";
import { HTTP_METHOD } from "../constants/HTTP_METHODS.js";
import { HttpApi } from "../lib/http.js";
import { getCookie } from "../lib/utils";
import { COOKIE_LEAD_TOKEN_CONFIG } from "../constants/LOAN_SIM.js";

export default class LeadRegistrationService {

  static async crearLead(
    { dni, turnstileToken, celular, selectedCuit, term_y_cond, situacion_laboral, fecha_nacimiento },
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

  static async subirDni({ leadId }, { dniFront, dniBack }, signal = null, retryConfig = null) {
    try {
      const url = `${LANDING_BACKEND_URL}/api/lead-registration/subir-dni/${leadId}`;
      const token = await getCookie(COOKIE_LEAD_TOKEN_CONFIG.NAME);
      const formData = new FormData();
      formData.append("dniFront", dniFront);
      formData.append("dniBack", dniBack);
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
        throw new Error(data.message || "Error al subir el DNI");
      }
      return data;
    } catch (error) {
      console.error("SUBIR_DNI_SERVICE_ERROR:", error);
      throw error;
    }
  }

  static async subirDniMobile({ leadId }, { dniFront, dniBack }, tokenOverride, signal = null, retryConfig = null) {
    try {
      const url = `${LANDING_BACKEND_URL}/api/lead-registration/subir-dni/${leadId}`;
      const formData = new FormData();
      formData.append("dniFront", dniFront);
      formData.append("dniBack", dniBack);
      const response = await HttpApi(
        url,
        formData,
        HTTP_METHOD.POST,
        LANDING_BACKEND_API_KEY,
        tokenOverride,
        signal,
        retryConfig,
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Error al subir el DNI");
      }
      return data;
    } catch (error) {
      console.error("SUBIR_DNI_MOBILE_SERVICE_ERROR:", error);
      throw error;
    }
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

  static async eliminarRecibo(reciboId, signal = null) {
    try {
      const url = `${LANDING_BACKEND_URL}/api/lead-registration/subir-recibos/${reciboId}`;
      const token = await getCookie(COOKIE_LEAD_TOKEN_CONFIG.NAME);
      const response = await HttpApi(
        url,
        null,
        HTTP_METHOD.DELETE,
        LANDING_BACKEND_API_KEY,
        token,
        signal,
      );
      const data = await response.json();
      if (!response.ok) {
        const err = new Error(data.message || "Error al eliminar el recibo");
        if (data.cause) err.cause = data.cause;
        throw err;
      }
      return data;
    } catch (error) {
      console.error("ELIMINAR_RECIBO_SERVICE_ERROR:", error);
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

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Error al obtener el estado del lead");
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
}
