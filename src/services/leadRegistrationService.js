import { LANDING_BACKEND_URL, LANDING_BACKEND_API_KEY } from "../config";
import { HTTP_METHOD } from "../constants/HTTP_METHODS.js";
import { HttpApi } from "../lib/http.js";
import { getCookie } from "../lib/utils";
import { COOKIE_LEAD_TOKEN_CONFIG } from "../constants/LOAN_SIM.js";

export default class LeadRegistrationService {

  static async crearLead(
    { dni, turnstileToken, huella_dispositivo, request_id, celular },
    signal = null,
  ) {
    try {
      const url = `${LANDING_BACKEND_URL}/api/lead-registration/crear`;
      const body = {
        dni,
        turnstileToken,
        huella_dispositivo,
        request_id,
        celular,
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

  static async subirDni({ leadId }, { dniFront, dniBack }, signal = null) {
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

  static async subirRecibo({ leadId }, file, signal = null) {
    try {
      const url = `${LANDING_BACKEND_URL}/api/lead-registration/subir-recibo/${leadId}`;
      const token = await getCookie(COOKIE_LEAD_TOKEN_CONFIG.NAME);
      const formData = new FormData();
      formData.append("file", file);
      const response = await HttpApi(
        url,
        formData,
        HTTP_METHOD.POST,
        LANDING_BACKEND_API_KEY,
        token,
        signal,
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Error al subir el recibo");
      }
      return data;
    } catch (error) {
      console.error("SUBIR_RECIBO_SERVICE_ERROR:", error);
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

  static async verificarOTPCelular({ leadId, codigo }, signal = null) {
    try {
      const url = `${LANDING_BACKEND_URL}/api/lead-registration/verificar-otp-celular`;
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
}
