/**
 * Lógica pura de resolución de estado para MisSolicitudesScreen.
 * Exportada separadamente para permitir unit testing sin renderizar el componente.
 */

export const RESUME_ACCION = {
  RETOMAR_REGISTRO: "retomar_registro",
  CONTINUAR_SIMULACION: "continuar_simulacion",
  VER_PRESTAMO: "ver_prestamo",
};

const SIM_EN_CURSO = new Set([
  "PENDIENTE",
  "SIMULACION",
  "EMAIL_VALIDATION",
  "OTP_VALIDATION",
  "COMPLIANCE",
  "CBU_VALIDATION",
  "MOBBEX_SUBSCRIPTION",
]);

const ONBOARDING_INCOMPLETO = new Set([
  "LEAD_CREADO",
  "CELULAR_VALIDADO",
  "DNI_SUBIDO",
  "RECIBO_SUBIDO",
  "PHONE_PICKER",
  "EMAIL_PENDING_ADVISOR",
  "PENDIENTE",
  "REALIZADO",
]);

const ONBOARDING_LABEL = {
  LEAD_CREADO: "Solicitud iniciada",
  PHONE_PICKER: "Selección de teléfono pendiente",
  EMAIL_PENDING_ADVISOR: "Actualización de email pendiente",
  CELULAR_VALIDADO: "Celular validado",
  DNI_SUBIDO: "DNI cargado",
  RECIBO_SUBIDO: "Recibo cargado",
  ONBOARDING_COMPLETO: "Registro completo",
  EN_ANALISIS: "En análisis",
  RECHAZADO: "Solicitud no aprobada",
  PENDIENTE: "Pendiente",
  REALIZADO: "Realizado",
};

const SIM_EN_CURSO_VISTA = {
  PENDIENTE: {
    label: "Pendiente",
    boton: "Continuar simulación",
    descripcion: "Elegí el préstamo para continuar.",
  },
  SIMULACION: {
    label: "Simulación disponible",
    boton: "Continuar simulación",
    descripcion: "Elegí el préstamo para continuar.",
  },
  EMAIL_VALIDATION: {
    label: "Validación de email pendiente",
    boton: "Validar email",
    descripcion: "Validá el email para continuar.",
  },
  OTP_VALIDATION: {
    label: "Código de validación pendiente",
    boton: "Ingresar código OTP",
    descripcion: "Ingresá el código OTP para continuar.",
  },
  COMPLIANCE: {
    label: "Declaración PEP/SO pendiente",
    boton: "Completar declaración",
    descripcion: "Completá la declaración PEP/SO.",
  },
  CBU_VALIDATION: {
    label: "Validación de CBU/CVU",
    boton: "Ingresar o confirmar CBU/CVU",
    descripcion: "Ingresá o confirmá tu CBU/CVU.",
  },
  MOBBEX_SUBSCRIPTION: {
    label: "Suscripción pendiente",
    boton: "Continuar o reintentar",
    descripcion: "Continuá o reintentá la suscripción.",
  },
};

export function addDays(iso, days) {
  if (!iso) return null;
  return new Date(new Date(iso).getTime() + days * 24 * 60 * 60 * 1000);
}

function noAprobada(fechaRechazo) {
  return {
    label: "Solicitud no aprobada",
    tipo: "danger",
    descripcion: null,
    accion: null,
    retryDate: fechaRechazo ? addDays(fechaRechazo, 45) : null,
  };
}

function enAnalisis() {
  return {
    label: "En análisis",
    tipo: "warning",
    descripcion: "Estamos revisando tu solicitud.",
    accion: null,
    retryDate: null,
  };
}

function continuarSimulacion(simEstado) {
  const vista = SIM_EN_CURSO_VISTA[simEstado];
  return {
    label: vista?.label || "Simulación disponible",
    tipo: "neutral",
    descripcion: vista?.descripcion || "Continuá la simulación de tu préstamo.",
    accion: RESUME_ACCION.CONTINUAR_SIMULACION,
    boton: vista?.boton || "Continuá tu simulación →",
    retryDate: null,
  };
}

function retomarRegistro(onboarding) {
  return {
    label: ONBOARDING_LABEL[onboarding] || "Solicitud incompleta",
    tipo: "neutral",
    descripcion: "Retomá tu registro donde lo dejaste.",
    accion: RESUME_ACCION.RETOMAR_REGISTRO,
    retryDate: null,
  };
}

function prestamoCompletado() {
  return {
    label: "Préstamo completado",
    tipo: "success",
    descripcion: "Tu préstamo fue procesado exitosamente.",
    accion: RESUME_ACCION.VER_PRESTAMO,
    boton: "Ver préstamo",
    retryDate: null,
  };
}

function registroCompleto() {
  return {
    label: "Registro completo",
    tipo: "neutral",
    descripcion: "Continuá la simulación de tu préstamo.",
    accion: RESUME_ACCION.CONTINUAR_SIMULACION,
    retryDate: null,
  };
}

function vistaSimulacionSinContinuar(simEstado) {
  if (simEstado === "PENDING_CBU_VALIDATION") {
    return {
      label: "CBU/CVU en revisión",
      tipo: "warning",
      descripcion: "Esperá la resolución de Operaciones.",
      accion: null,
      retryDate: null,
    };
  }
  if (simEstado === "DISPOSITIVO_RECHAZADO") {
    return {
      label: "Dispositivo rechazado",
      tipo: "danger",
      descripcion: "No podés continuar con esta simulación.",
      accion: null,
      retryDate: null,
    };
  }
  if (simEstado === "RECHAZADO") {
    return {
      label: "Operación no aprobada",
      tipo: "danger",
      descripcion: "Esta operación no fue aprobada.",
      accion: null,
      retryDate: null,
    };
  }
  return null;
}

/**
 * Devuelve { label, tipo, descripcion, accion, retryDate }
 *  tipo: 'success' | 'warning' | 'danger' | 'neutral'
 *  retryDate: Date | null  (solo para NO_APROBADA)
 *
 * El onboarding manda mientras el registro no terminó. estado_gestion lo
 * copia el trigger desde scoring (ACEPTADO/ANALIZAR) apenas existe el lead,
 * y no puede tapar "Retomá tu registro" / "Continuá tu simulación".
 *
 * Prioridad:
 *  1. onboarding RECHAZADO / EN_ANALISIS
 *  2. onboarding incompleto → retomar registro (ignora gestión y préstamo SB)
 *  3. Préstamo SB → "Préstamo completado"
 *  4. sim en curso → continuar simulación
 *  5. ONBOARDING_COMPLETO → etiqueta de la simulación, sin continuar si está en revisión, rechazada o con dispositivo rechazado
 *  6. gestión ACEPTADO / RECHAZADO / ANALIZAR
 */
export function resolveEstado(solicitud) {
  const {
    estadoOnboarding,
    estadoOnboardingFecha,
    estadoGestion,
    fechaEstadoGestion,
    prestamo,
  } = solicitud;

  const gestion = estadoGestion?.toUpperCase() ?? null;
  const onboarding = estadoOnboarding?.toUpperCase() ?? null;
  const simEstado = prestamo?.estado?.toUpperCase() ?? null;

  if (onboarding === "RECHAZADO") {
    const fechaRechazo = estadoOnboardingFecha ?? fechaEstadoGestion ?? null;
    return noAprobada(fechaRechazo);
  }

  if (onboarding === "EN_ANALISIS") {
    return enAnalisis();
  }

  if (ONBOARDING_INCOMPLETO.has(onboarding)) {
    return retomarRegistro(onboarding);
  }

  if (prestamo?.idPrestamoDB) {
    return prestamoCompletado();
  }

  if (!onboarding) {
    return retomarRegistro(onboarding);
  }

  if (simEstado && SIM_EN_CURSO.has(simEstado)) {
    return continuarSimulacion(simEstado);
  }

  if (onboarding === "ONBOARDING_COMPLETO") {
    if (simEstado === "COMPLETADO") {
      if (gestion === "RECHAZADO") {
        const fechaRechazo = fechaEstadoGestion ?? estadoOnboardingFecha ?? null;
        return noAprobada(fechaRechazo);
      }
      if (gestion === "ACEPTADO") {
        return prestamoCompletado();
      }
      return enAnalisis();
    }
    if (gestion === "RECHAZADO") {
      const fechaRechazo = fechaEstadoGestion ?? estadoOnboardingFecha ?? null;
      return noAprobada(fechaRechazo);
    }
    const sinContinuar = vistaSimulacionSinContinuar(simEstado);
    if (sinContinuar) return sinContinuar;
    if (gestion === "ANALIZAR") {
      return enAnalisis();
    }
    if (!simEstado) return registroCompleto();
    return continuarSimulacion(simEstado);
  }

  const sinContinuar = vistaSimulacionSinContinuar(simEstado);
  if (sinContinuar) return sinContinuar;

  if (gestion === "ACEPTADO") {
    return {
      label: "Aprobada",
      tipo: "success",
      descripcion: "Tu solicitud fue aprobada. Estamos gestionando tu préstamo.",
      accion: null,
      retryDate: null,
    };
  }

  if (gestion === "RECHAZADO") {
    const fechaRechazo = fechaEstadoGestion ?? estadoOnboardingFecha ?? null;
    return noAprobada(fechaRechazo);
  }

  if (gestion === "ANALIZAR") {
    return enAnalisis();
  }

  return retomarRegistro(onboarding);
}
