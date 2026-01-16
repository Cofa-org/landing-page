export const LOAN_SIM_STEPS = {
  SIMULACION: "SIMULACION",
  EMAIL_VALIDATION: "EMAIL_VALIDATION",
  OTP_VALIDATION: "OTP_VALIDATION",
  CBU_VALIDATION: "CBU_VALIDATION",
  COMPLETADO: "COMPLETADO",
};

export const OTP_CONFIG = {
  OTP_LENGTH: 6,
  COOLDOWN_DURATION: 120, // seconds in frontend
};

export const CBU_CONFIG = {
  CBU_LENGTH: 22,
};

export const UI_CONFIG = {
  HOME_URL: "https://www.cofa.com.ar/",
};

export const COOKIE_CONFIG = {
  NAME: "scoringId",
  EXPIRY_DAYS: Date.now() + 2 * 60 * 60 * 1000, // 2 hours

};