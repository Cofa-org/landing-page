import { HttpApi } from "../http";
import { VITE_COFA_AUTH_URL, VITE_URL_LOCAL, VITE_COFA_AUTH_API_KEY } from "../config";
import { HTTP_METHOD } from "../constants/HTTP_METHODS.js";

export default class MailService {
  static async sendMail(type, formData) {
    try {
      const url = `${VITE_COFA_AUTH_URL || VITE_URL_LOCAL}/mail/${type}`;
      const apiKey = VITE_COFA_AUTH_API_KEY;

      const response = await HttpApi(url, formData, HTTP_METHOD.POST, apiKey, null);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error al enviar correo de tipo: ${type}`);
      }

      return response;
    } catch (error) {
      console.error(`MAIL_SERVICE_ERROR (${type}):`, error);
      throw error;
    }
  }
}
