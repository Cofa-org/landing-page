import { Thumbmark } from "@thumbmarkjs/thumbmarkjs";
import { THUMBMARKJS_API_KEY } from "../config.js";
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
    console.log("THUMBMARKJS_API_KEY:", THUMBMARKJS_API_KEY);
    const instance = new Thumbmark({
      api_key: THUMBMARKJS_API_KEY,
      metadata,
    });
    return await instance.get();
  } catch (error) {
    console.warn("Fingerprint error:", error?.message);
    return null;
  }
};

export const getFingerprint = getDeviceFingerprint;

/**
 * Mapea el objeto ThumbmarkJS a un objeto plano huellaData.
 * Usado por useLeadRegistration y useLoanSimulator.
 * @param {Object|null} fingerprint - Objeto returned by getFingerprint()
 * @returns {Object|null} huellaData plano o null
 */
export const mapFingerprintToHuellaData = (fingerprint) => {
  if (!fingerprint) return null;
  return {
    thumbmark: fingerprint.thumbmark,
    visitor_id: fingerprint.visitorId,
    ip_address: fingerprint.info?.ip_address?.ip_address || null,
    pais: fingerprint.info?.country?.name || null,
    browser_name: fingerprint.components?.system?.browser?.name || null,
    browser_version: fingerprint.components?.system?.browser?.version || null,
    plataforma: fingerprint.components?.system?.platform || null,
    es_movil: fingerprint.components?.system?.mobile || false,
    zona_horaria: fingerprint.components?.locales?.timezone || null,
    uniqueness_score: fingerprint.info?.uniqueness?.score || null,
    es_vpn: fingerprint.info?.classification?.vpn || false,
    es_tor: fingerprint.info?.classification?.tor || false,
    es_bot: fingerprint.info?.classification?.bot || false,
    es_datacenter: fingerprint.info?.classification?.datacenter || false,
    nivel_peligro: fingerprint.info?.classification?.danger_level ?? null,
  };
};
