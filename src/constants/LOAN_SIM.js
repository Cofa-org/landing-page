export const LOAN_SIM_STEPS = {
  LEAD_REGISTRATION: "LEAD_REGISTRATION",
  DNI_UPLOAD: "DNI_UPLOAD",
  RECIBO_UPLOAD: "RECIBO_UPLOAD",
  WELCOME: "WELCOME",
  SIMULACION: "SIMULACION",
  EMAIL_VALIDATION: "EMAIL_VALIDATION",
  OTP_VALIDATION: "OTP_VALIDATION",
  COMPLIANCE: "COMPLIANCE",
  CBU_VALIDATION: "CBU_VALIDATION",
  COMPLETADO: "COMPLETADO",
  RECHAZADO: "RECHAZADO",
  EN_ANALISIS: "EN_ANALISIS",
  PHONE_VALIDATION: "PHONE_VALIDATION",
  DEVICE_MISMATCH: "DISPOSITIVO_RECHAZADO",
};

export const OTP_CONFIG = {
  OTP_PHONE_LENGTH: 4, // 4 dígitos para celular
  OTP_EMAIL_LENGTH: 6, // 6 dígitos para email
  COOLDOWN_DURATION: 120, // seconds in frontend
  DESTINATION_TYPE: {
    PHONE: "phone",
    EMAIL: "email",
  },
};

export const CBU_CONFIG = {
  CBU_LENGTH: 22,
  CVU_LENGTH: 22,
  CVU_PREFIX: "000",
  CVU_CHECK_DIGIT_POSITION: 7,
  CVU_CHECK_DIGIT_VALUE: "1",
};

export const UI_CONFIG = {
  HOME_URL: "https://www.cofa.com.ar/",
};

export const COOKIE_CONFIG = {
  NAME: "scoringId",
  EXPIRY_MS: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
};

export const COOKIE_LEAD_TOKEN_CONFIG = {
  NAME: "leadToken",
  EXPIRY_MS: Date.now() + 2 * 60 * 60 * 1000, // 2 hours in ms
};

export const COMPLIANCE_STEPS = Object.freeze({
  STATUS_CHECK: "STATUS_CHECK",
  INITIAL: "INITIAL",
  TYPE_SELECTION: "TYPE_SELECTION",
  PEP_TYPE_SELECTION: "PEP_TYPE_SELECTION",
  FORM_SO: "FORM_SO",
  FORM_PEP_DIRECT: "FORM_PEP_DIRECT",
  FORM_PEP_INDIRECT: "FORM_PEP_INDIRECT",
});

export const ONBOARDING_STATES = {
  LEAD_CREADO: "LEAD_CREADO",
  DNI_SUBIDO: "DNI_SUBIDO",
  RECIBO_SUBIDO: "RECIBO_SUBIDO",
  ONBOARDING_COMPLETO: "ONBOARDING_COMPLETO",
  RECHAZADO: "RECHAZADO",
  EN_ANALISIS: "EN_ANALISIS",
  CELULAR_VALIDADO: "CELULAR_VALIDADO",
};

export const PEP_TIPO = Object.freeze({
  DIRECTO: "DIRECTO",
  INDIRECTO: "INDIRECTO",
});


/**
 * Calibración DNI argentino → edad estimada.
 *
 * Fórmula: edad = baseAge + (añoActual - calibrationYear)
 *                 + (baseDniMillions - dni/1_000_000) × yearsPerMillion
 *
 * - 13M de DNI → 60 años en calibrationYear.
 * - 1 millón de DNI ≈ yearsPerMillion años de diferencia.
 * - El componente `(añoActual - calibrationYear)` ajusta la edad
 *   automáticamente con el paso del tiempo.
 * - Si la correlación demográfica del DNI cambiara, ajustar los
 *   valores `baseDniMillions`, `baseAge` o `yearsPerMillion`.
 *
 * - `tolerance` es el rango interno donde NO se muestra error
 *   (margen de tolerancia para imprecisión del DNI). Los mensajes
 *   al usuario siempre se muestran con el rango estricto 18-60.
 */
export const DNI_AGE_CALIBRATION = {
  baseDniMillions: 13,
  baseAge: 60,
  yearsPerMillion: 1.2,
  calibrationYear: 2026,
  tolerance: { min: 16, max: 63 },
};