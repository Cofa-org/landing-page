import { Thumbmark } from "@thumbmarkjs/thumbmarkjs";

let thumbmarkInstance = null;

/**
 * Obtiene el fingerprint completo del dispositivo.
 * @returns {Promise<Object|null>} Objeto completo de ThumbmarkJS
 */
export const getDeviceFingerprint = async () => {
  try {
    if (!thumbmarkInstance) {
      thumbmarkInstance = new Thumbmark({
        api_key: import.meta.env.VITE_THUMBMARKJS_API_KEY,
      });
    }
    return await thumbmarkInstance.get();
  } catch (error) {
    console.warn("Fingerprint error:", error?.message);
    return null;
  }
};

export const getFingerprint = getDeviceFingerprint;
