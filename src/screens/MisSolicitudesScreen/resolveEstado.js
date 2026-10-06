/**
 * Lógica pura de resolución de estado para MisSolicitudesScreen.
 * Exportada separadamente para permitir unit testing sin renderizar el componente.
 */

export const RESUME_ACCION = {
  RETOMAR_REGISTRO: "retomar_registro",
  CONTINUAR_SIMULACION: "continuar_simulacion",
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
  "PENDIENTE",
  "REALIZADO",
]);

export function addDays(iso, days) {
  if (!iso) return null;
  return new Date(new Date(iso).getTime() + days * 24 * 60 * 60 * 1000);
}

function noAprobada(fechaRechazo) {
  return {
    label: "No aprobada",
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
  const detalle = {
    PENDIENTE: "Elegí el préstamo para continuar.",
    SIMULACION: "Elegí el préstamo para continuar.",
    EMAIL_VALIDATION: "Falta validar el email de la simulación.",
    OTP_VALIDATION: "Falta el código de la simulación.",
    COMPLIANCE: "Falta completar la documentación.",
    CBU_VALIDATION: "Falta validar el CBU.",
    MOBBEX_SUBSCRIPTION: "Falta la firma y el débito.",
  };
  return {
    label: "Solicitud incompleta",
    tipo: "neutral",
    descripcion: detalle[simEstado] || "Continuá la simulación de tu préstamo.",
    accion: RESUME_ACCION.CONTINUAR_SIMULACION,
    retryDate: null,
  };
}

function retomarRegistro() {
  return {
    label: "Solicitud incompleta",
    tipo: "neutral",
    descripcion: "Retomá tu registro donde lo dejaste.",
    accion: RESUME_ACCION.RETOMAR_REGISTRO,
    retryDate: null,
  };
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
 *  3. Préstamo SB → "Solicitud finalizada"
 *  4. sim en curso → continuar simulación
 *  5. ONBOARDING_COMPLETO → continuar sim, salvo gestión/sim terminales
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
    return retomarRegistro();
  }

  if (prestamo?.idPrestamoDB) {
    return {
      label: "Solicitud finalizada",
      tipo: "success",
      descripcion: "Tu préstamo fue procesado exitosamente.",
      accion: null,
      retryDate: null,
    };
  }

  if (!onboarding) {
    return retomarRegistro();
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
        return {
          label: "Aprobada",
          tipo: "success",
          descripcion: "Tu solicitud fue aprobada. Estamos gestionando tu préstamo.",
          accion: null,
          retryDate: null,
        };
      }
      return enAnalisis();
    }
    if (gestion === "RECHAZADO") {
      const fechaRechazo = fechaEstadoGestion ?? estadoOnboardingFecha ?? null;
      return noAprobada(fechaRechazo);
    }
    if (gestion === "ANALIZAR") {
      return enAnalisis();
    }
    return continuarSimulacion(simEstado);
  }

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

  return retomarRegistro();
}
