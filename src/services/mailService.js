import { HttpApi } from "../lib/http.js";
import { HTTP_METHOD } from "../constants/HTTP_METHODS.js";
import { LANDING_BACKEND_URL, LANDING_BACKEND_API_KEY } from "../config.js";

export default class MailService {
  static async sendMail(type, formData) {
    try {
      const url = `${LANDING_BACKEND_URL}/api/mail/${type}`;
      const apiKey = LANDING_BACKEND_API_KEY;
      const response = await HttpApi(url, formData, HTTP_METHOD.POST, apiKey, null);

      let responseData;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        responseData = { message: await response.text() };
      }

      if (!response.ok) {
        console.error("MailService error body:", responseData);
        throw new Error(responseData.message || `Error al enviar correo de tipo: ${type}`);
      }

      return responseData;
    } catch (error) {
      console.error(`MAIL_SERVICE_ERROR (${type}):`, error);
      throw error;
    }
  }
}
