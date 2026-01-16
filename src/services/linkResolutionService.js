import { HTTP_METHOD } from "../constants/HTTP_METHODS.js";
import { HttpApi } from "../http.js";



export default class LinkResolutionService {
  static async verificarAcceso(shortId) {
    try {
  
      const url = `${VITE_COFA_AUTH_URL || VITE_URL_LOCAL}/api/simulador-prestamos/verificar`;
      const apiKey = VITE_COFA_AUTH_API_KEY;
      const body = {
        // shortId,
      };
      const response = await HttpApi(linkServiceLocalUrl, body, HTTP_METHOD.POST, linkServiceLocalKey, null);
      if (!response.ok) {
        throw new Error(response.message || "Error al verificar acceso");
      }
      return await response.json();
    } catch (error) {
      console.error("VERIFICAR_ACCESO_ERROR:", error);
      throw error;
    }
  }
}