import { VITE_COFA_AUTH_API_KEY, VITE_COFA_AUTH_URL, VITE_URL_LOCAL } from "../config.js";
import { HTTP_METHOD } from "../constants/HTTP_METHODS.js";
import { HttpApi } from "../http.js";

export default class LinkResolutionService {
  static async consumeLink(shortId) {
    try {
      const url = `${VITE_COFA_AUTH_URL || VITE_URL_LOCAL}/api/lrs/consume/${shortId}`;
      const apiKey = VITE_COFA_AUTH_API_KEY;
      const response = await HttpApi(url, null, HTTP_METHOD.POST, apiKey, null);
      if (!response.ok) {
        throw new Error(response.message || "Error al consumir el link");
      }
      return await response.json();
    } catch (error) {
      console.error("CONSUME_LINK_ERROR:", error);
      throw error;
    }
  }
}
