export const ERROR_CAUSE = Object.freeze({
  SCORING_RECHAZADO: "SCORING_RECHAZADO",
  COHERENCIA_FINANCIERA_ERROR: "COHERENCIA_FINANCIERA_ERROR",
  EDAD_INVALIDA: "EDAD_INVALIDA",
  EDAD_MENOR_MINIMA: "EDAD_MENOR_MINIMA",
  EDAD_MAYOR_MAXIMA: "EDAD_MAYOR_MAXIMA",
  DEVICE_FINGERPRINT_MISMATCH: "DEVICE_FINGERPRINT_MISMATCH",
  SITUACION_LABORAL_NO_ELEGIBLE: "SITUACION_LABORAL_NO_ELEGIBLE",
});

export const ERROR_MESSAGE = Object.freeze({
  SCORING_RECHAZADO: "No pudimos continuar con tu registro. Si querés, podés volver a intentarlo",
  COHERENCIA_FINANCIERA_ERROR: "Inconsistencia financiera",
  EDAD_INVALIDA: "Para este servicio necesitás tener entre 18 y 60 años",
  EDAD_MENOR_MINIMA: "Debés tener al menos 18 años",
  EDAD_MAYOR_MAXIMA: "Debés tener 60 años o menos",
});
