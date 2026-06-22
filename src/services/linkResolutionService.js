import { LRS_API_KEY, LRS_URL } from "../config.js";
import { HTTP_METHOD } from "../constants/HTTP_METHODS.js";
import { HttpApi } from "../lib/http.js";

export default class LinkResolutionService {
  static async consumeLink(shortId) {
    try {
      const url = `${LRS_URL}/consume?id=${shortId}`;
      const apiKey = LRS_API_KEY;
      const response = await HttpApi(url, null, HTTP_METHOD.POST, apiKey, null);
      if (!response.ok) {
        throw new Error(response.message || "Error al consumir el link");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("CONSUME_LINK_ERROR:", error);
      throw error;
    }
  }
}
