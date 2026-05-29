import { LANDING_BACKEND_URL, LANDING_BACKEND_API_KEY } from "../config";
import { HTTP_METHOD } from "../constants/HTTP_METHODS.js";
import { HttpApi } from "../http.js";

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
}