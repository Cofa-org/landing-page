export const ERROR_CAUSE = Object.freeze({
  SCORING_RECHAZADO: "SCORING_RECHAZADO",
  COHERENCIA_FINANCIERA_ERROR: "COHERENCIA_FINANCIERA_ERROR",
  EDAD_INVALIDA: "EDAD_INVALIDA",
  EDAD_MENOR_MINIMA: "EDAD_MENOR_MINIMA",
  EDAD_MAYOR_MAXIMA: "EDAD_MAYOR_MAXIMA",
});

export const ERROR_MESSAGE = Object.freeze({
  SCORING_RECHAZADO: "No es posible continuar con el registro",
  COHERENCIA_FINANCIERA_ERROR: "Inconsistencia financiera",
  EDAD_INVALIDA: "Fuera del rango de edad",
  EDAD_MENOR_MINIMA: "Debés tener al menos 18 años",
  EDAD_MAYOR_MAXIMA: "Debés tener 60 años o menos",
});
