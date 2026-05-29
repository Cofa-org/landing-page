import { LANDING_BACKEND_URL, LANDING_BACKEND_API_KEY } from "../config";
import { HTTP_METHOD } from "../constants/HTTP_METHODS.js";
import { HttpApi } from "../http.js";
import { getCookie } from "../lib/utils";
import { COOKIE_LEAD_TOKEN_CONFIG } from "../constants/LOAN_SIM.js";

export default class LeadRegistrationService {
  static async crearLead({ dni, nombre_completo, apellido }, signal = null) {
    try {
      const url = `${LANDING_BACKEND_URL}/api/lead-registration/crear`;
      const body = { dni, nombre_completo, apellido };
      const response = await HttpApi(url, body, HTTP_METHOD.POST, LANDING_BACKEND_API_KEY, null, signal);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al registrar el lead");
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
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "x-api-key": LANDING_BACKEND_API_KEY,
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
        signal,
      });

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
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "x-api-key": LANDING_BACKEND_API_KEY,
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
        signal,
      });

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
}