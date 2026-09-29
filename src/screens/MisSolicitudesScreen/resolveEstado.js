/**
 * Lógica pura de resolución de estado para MisSolicitudesScreen.
 * Exportada separadamente para permitir unit testing sin renderizar el componente.
 */

export function addDays(iso, days) {
  if (!iso) return null;
  return new Date(new Date(iso).getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Devuelve { label, tipo, descripcion, accion, retryDate }
 *  tipo: 'success' | 'warning' | 'danger' | 'neutral'
 *  retryDate: Date | null  (solo para NO_APROBADA)
 *
 * Prioridad de estados (6 niveles):
 *  1. Préstamo en sistema externo → "Solicitud finalizada"
 *  2. gestión ACEPTADO → "Aprobada"
 *  3. gestión RECHAZADO → "No aprobada"
 *  4. onboarding RECHAZADO → "No aprobada"
 *  5. gestión ANALIZAR | onboarding ONBOARDING_COMPLETO → "En análisis"
 *  6. default → "Solicitud incompleta"
 *
 * Nota sobre fecha_estado_gestion vs estado_onboarding_fecha:
 *  El trigger `materialize_estado_gestion` (BEFORE UPDATE en webapp_sim_solicitudes)
 *  puede setear fecha_estado_gestion = NOW() cuando deriva estado_gestion = 'RECHAZADO'
 *  a partir de estado_onboarding = 'RECHAZADO'. Esa fecha refleja CUÁNDO CORRIÓ EL
 *  TRIGGER, no cuándo ocurrió el rechazo real.
 *  Por eso, cuando onboarding también es RECHAZADO, usamos estado_onboarding_fecha
 *  (la fecha del evento de rechazo real) como base del cálculo de los 45 días.
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

  // 1. Préstamo procesado en sistema externo → solicitud finalizada
  if (prestamo?.idPrestamoDB) {
    return {
      label: "Solicitud finalizada",
      tipo: "success",
      descripcion: "Tu préstamo fue procesado exitosamente.",
      accion: null,
      retryDate: null,
    };
  }

  // 2. Aprobada por gestión
  if (gestion === "ACEPTADO") {
    return {
      label: "Aprobada",
      tipo: "success",
      descripcion: "Tu solicitud fue aprobada. Estamos gestionando tu préstamo.",
      accion: null,
      retryDate: null,
    };
  }

  // 3. No aprobada — rechazada por gestión
  if (gestion === "RECHAZADO") {
    // Si onboarding también es RECHAZADO, la gestión fue derivada por el trigger
    // (fecha_estado_gestion = cuándo corrió el trigger, no cuándo ocurrió el rechazo).
    // Preferimos estado_onboarding_fecha como fecha del evento real.
    // Si el operador rechazó manualmente (onboarding != RECHAZADO), la fecha de
    // gestión es la correcta.
    const fechaRechazo =
      onboarding === "RECHAZADO"
        ? (estadoOnboardingFecha ?? fechaEstadoGestion ?? null)
        : (fechaEstadoGestion ?? estadoOnboardingFecha ?? null);
    return {
      label: "No aprobada",
      tipo: "danger",
      descripcion: null,
      accion: null,
      retryDate: fechaRechazo ? addDays(fechaRechazo, 45) : null,
    };
  }

  // 4. No aprobada — rechazada en onboarding (sin rechazo explícito de gestión)
  if (onboarding === "RECHAZADO") {
    const fechaRechazo = estadoOnboardingFecha ?? fechaEstadoGestion ?? null;
    return {
      label: "No aprobada",
      tipo: "danger",
      descripcion: null,
      accion: null,
      retryDate: fechaRechazo ? addDays(fechaRechazo, 45) : null,
    };
  }

  // 5. En análisis (onboarding completo, esperando resolución de gestión)
  if (gestion === "ANALIZAR" || onboarding === "ONBOARDING_COMPLETO") {
    return {
      label: "En análisis",
      tipo: "warning",
      descripcion: "Estamos revisando tu solicitud.",
      accion: null,
      retryDate: null,
    };
  }

  // 6. Solicitud incompleta (LEAD_CREADO, DNI_SUBIDO, CELULAR_VALIDADO, etc.)
  return {
    label: "Solicitud incompleta",
    tipo: "neutral",
    descripcion: "Para retomar tu solicitud, comunicate con un asesor.",
    accion: null,
    retryDate: null,
  };
}
