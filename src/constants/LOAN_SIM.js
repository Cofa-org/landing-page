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
  MOBBEX_SUBSCRIPTION: "MOBBEX_SUBSCRIPTION",
  COMPLETADO: "COMPLETADO",
  RECHAZADO: "RECHAZADO",
  EN_ANALISIS: "EN_ANALISIS",
  PHONE_VALIDATION: "PHONE_VALIDATION",
  IDENTITY_SELECTION: "IDENTITY_SELECTION",
  DISPOSITIVO_RECHAZADO: "DISPOSITIVO_RECHAZADO",
};

export const OTP_CONFIG = {
  OTP_PHONE_LENGTH: 6, // 6 dígitos para celular (generado localmente en backend, verificado vía validarCodigo)
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
  // Duración relativa en ms (no timestamp absoluto). El call-site suma
  // Date.now() al pasarlo a setCookieWithDuration para evitar que el módulo
  // "congele" el expiry al importarse (bug histórico: Date.now() se evaluaba
  // una sola vez al cargar el módulo).
  EXPIRY_MS: 2 * 60 * 60 * 1000, // 2 hours in ms
};

export const COOKIE_LOAN_INFO_CONFIG = {
  NAME: "loanInfo",
  // Cache del response de obtenerInfoPrestamo: la info del préstamo es
  // inmutable una vez creado el préstamo, así que cachearla evita el
  // round-trip al backend en cada click de "Info prestamo".
  EXPIRY_MS: 2 * 60 * 60 * 1000, // 2 hours in ms
};

export const COOKIE_LEAD_TOKEN_CONFIG = {
  NAME: "leadToken",
  EXPIRY_MS: Date.now() + 2 * 60 * 60 * 1000, // 2 hours in ms
};

export const COOKIE_SIMULADOR_TOKEN_CONFIG = {
  NAME: "simuladorToken",
  // 24 hours in ms — espejo de la duración del JWT (Task 0/1) para que la
  // cookie no expire antes que el token. El usuario puede pausar y volver
  // al día siguiente sin perder la sesión del simulador.
  EXPIRY_MS: Date.now() + 24 * 60 * 60 * 1000,
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
  baseDniMillions: 16,
  baseAge: 60,
  yearsPerMillion: 1.2,
  calibrationYear: 2026,
  tolerance: { min: 18, max: 63 },
};

export const SITUACION_LABORAL_OPTIONS = Object.freeze([
  { value: "RELACION_DEPENDENCIA", label: "Relación de dependencia" },
  { value: "MONOTRIBUTISTA",       label: "Monotributista" },
  { value: "JUBILADO_PENSIONADO",  label: "Jubilado - Pensionado" },
  { value: "ESTUDIANTE",           label: "Estudiante" },
  { value: "AUTONOMO",             label: "Autónomo" },
  { value: "DESOCUPADO",           label: "Desocupado" },
  { value: "EN_NEGRO",             label: "En negro" },
]);

export const REJECTION_CONFIG = {
  DEVICE_MISMATCH: {
    cause: "DEVICE_MISMATCH",
    title: "Dispositivo diferente detectado",
    description:
      "Detectamos que estás intentando acceder desde un dispositivo diferente al que usaste para registrarte. Por favor, ponete en contacto con un operador para continuar con tu solicitud.",
    illustration: null, // RejectedStep renderiza MdWarning de react-icons cuando illustration es null; no usa imagen.
    primaryAction: {
      label: "Volver al inicio",
      href: "https://www.cofa.com.ar/",
      target: "_self",
    },
  },
  PHONE_NOT_VALIDATED: {
    cause: "PHONE_NOT_VALIDATED",
    title: "En este momento no podemos avanzar con tu simulación.",
    description:
      "Necesitamos validar tu celular para poder continuar. Por favor, contactate con un asesor y te ayudamos.",
    illustration: "/img/rejected_empathy.webp",
    primaryAction: {
      label: "Comunicarme con un asesor",
      href: "https://wa.me/5491137570853?text=Hola!!%20Necesito%20ayuda%20para%20simular%20mi%20préstamo!",
      target: "_blank",
    },
  },
};