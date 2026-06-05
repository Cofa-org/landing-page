import { Thumbmark } from "@thumbmarkjs/thumbmarkjs";

/**
 * Obtiene el fingerprint del dispositivo con metadata opcional.
 * Se crea una nueva instancia por llamado (no singleton) porque metadata
 * cambia en cada registro y debe enviarse al webhook de ThumbmarkJS.
 *
 * @param {Object} metadata - Metadata enviada al webhook (ej: { dni: "12345678" })
 * @returns {Promise<Object|null>} Objeto completo de ThumbmarkJS
 */
export const getDeviceFingerprint = async (metadata = {}) => {
  try {
    const instance = new Thumbmark({
      api_key: import.meta.env.VITE_THUMBMARKJS_API_KEY,
      metadata,
    });
    return await instance.get();
  } catch (error) {
    console.warn("Fingerprint error:", error?.message);
    return null;
  }
};

export const getFingerprint = getDeviceFingerprint;
