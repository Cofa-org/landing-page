export const DNI_LIMITS = Object.freeze({ maxBytes: 20971520, maxPixels: 16000000, maxAxis: 8192 });
export const DNI_ROTATIONS = Object.freeze([0, 90, 180, 270]);

// Closed protocol vocabulary. External messages are never displayed or retained.
export const DNI_ERRORS = Object.freeze({
  DNI_CAPTURE_INVALID_INPUT: [400, "technical", false, "Reabrí la captura e intentá de nuevo."],
  DNI_SESSION_EXPIRED: [401, "technical", false, "Reabrí el registro correspondiente o contactá a un asesor."],
  DNI_FORBIDDEN: [403, "technical", false, "Reabrí el registro correspondiente o contactá a un asesor."],
  DNI_CAPTURE_NOT_FOUND: [404, "technical", false, "Reabrí el registro correspondiente o contactá a un asesor."],
  DNI_CAPTURE_CONTEXT_REQUIRED: [409, "technical", false, "Actualizá el contexto antes de capturar."],
  DNI_CAPTURE_CONTEXT_CHANGED: [409, "technical", false, "El registro cambió. Actualizá el contexto para continuar."],
  DNI_CAPTURE_SUPERSEDED: [409, "technical", false, "Se recibió otra captura. Actualizá el contexto antes de iniciar un nuevo envío."],
  DNI_CAPTURE_STEP_UNAVAILABLE: [409, "technical", false, "Continuá desde el paso vigente de tu registro o contactá a un asesor."],
  DNI_FILE_TOO_LARGE: [413, "technical", false, "Volvé a sacar la foto con un celular compatible o contactá a un asesor."],
  DNI_IMAGE_LIMIT: [413, "technical", false, "No pudimos usar ese frame. Reintentá con otro celular o contactá a un asesor."],
  DNI_IMAGE_UNSUPPORTED: [415, "technical", false, "Reabrí la cámara y volvé a sacar la foto o contactá a un asesor."],
  DNI_IMAGE_INVALID: [422, "capture", false, "No pudimos leer la foto. Volvé a capturar la cara indicada o contactá a un asesor."],
  DNI_UPLOAD_BUSY: [429, "technical", true, "Esperá unos segundos y volvé a intentar el envío."],
  DNI_IMAGE_TIMEOUT: [503, "technical", true, "El procesamiento demoró demasiado. Conservamos tus fotos para que reintentes."],
  DNI_STORAGE_UNAVAILABLE: [503, "technical", true, "No pudimos guardar las fotos. Conservamos las tomas para que reintentes."],
  DNI_CAPTURE_SAVE_FAILED: [503, "technical", true, "No pudimos completar el envío. Conservamos las tomas para que reintentes."],
  DNI_TECHNICAL_ERROR: [502, "technical", true, "No pudimos completar la operación. Volvé a intentar o contactá a un asesor."],
  DNI_NETWORK_ERROR: [0, "technical", true, "Sin conexión. Verificá tu WiFi y volvé a intentar; conservamos tus fotos."],
});
