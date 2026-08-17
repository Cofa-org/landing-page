import { useState, useCallback, useEffect } from "react";
import { LOAN_SIM_STEPS, ONBOARDING_STATES } from "../../../constants/LOAN_SIM.js";
import { getCookie, setCookie } from "../../../lib/utils.js";
import { COOKIE_LEAD_TOKEN_CONFIG } from "../../../constants/LOAN_SIM.js";
import { getDecodedToken } from "../../../lib/token.js";
import { ERROR_CAUSE } from "../../../constants/error.js";
import LeadRegistrationService from "../../../services/leadRegistrationService.js";

const ONBOARDING_STEPS = {
  LEAD_REGISTRATION: LOAN_SIM_STEPS.LEAD_REGISTRATION,
  DNI_UPLOAD: LOAN_SIM_STEPS.DNI_UPLOAD,
  RECIBO_UPLOAD: LOAN_SIM_STEPS.RECIBO_UPLOAD,
  WELCOME: LOAN_SIM_STEPS.WELCOME,
};

const NEXT_STEP_MAP = {
  [LOAN_SIM_STEPS.LEAD_REGISTRATION]: LOAN_SIM_STEPS.PHONE_VALIDATION,
  // PHONE_VALIDATION → se decide dinámicamente en navigateToNext según es_cliente.
  [LOAN_SIM_STEPS.DNI_UPLOAD]: LOAN_SIM_STEPS.RECIBO_UPLOAD,
  [LOAN_SIM_STEPS.RECIBO_UPLOAD]: LOAN_SIM_STEPS.WELCOME,
};

/**
 * Decide el siguiente step después de PHONE_VALIDATION.
 * Si el lead es cliente (es_cliente === true), saltea DNI_UPLOAD.
 * @param {boolean|null|undefined} esCliente
 * @returns {string} LOAN_SIM_STEPS.RECIBO_UPLOAD | LOAN_SIM_STEPS.DNI_UPLOAD
 */
const getNextStepAfterPhoneValidation = (esCliente) =>
  esCliente === true ? LOAN_SIM_STEPS.RECIBO_UPLOAD : LOAN_SIM_STEPS.DNI_UPLOAD;

const PREV_STEP_MAP = {
  [LOAN_SIM_STEPS.PHONE_VALIDATION]: LOAN_SIM_STEPS.LEAD_REGISTRATION,
  [LOAN_SIM_STEPS.DNI_UPLOAD]: LOAN_SIM_STEPS.LEAD_REGISTRATION,
  [LOAN_SIM_STEPS.IDENTITY_SELECTION]: LOAN_SIM_STEPS.LEAD_REGISTRATION,
  // RECIBO_UPLOAD → se decide dinámicamente en navigateToPrev según es_cliente.
  [LOAN_SIM_STEPS.WELCOME]: LOAN_SIM_STEPS.RECIBO_UPLOAD,
  [LOAN_SIM_STEPS.EN_ANALISIS]: LOAN_SIM_STEPS.RECIBO_UPLOAD,
  [LOAN_SIM_STEPS.PHONE_PICKER]: LOAN_SIM_STEPS.PHONE_VALIDATION,
};

/**
 * Decide el step previo cuando el actual es RECIBO_UPLOAD.
 * Si el lead es cliente (es_cliente === true), no hay DNI_UPLOAD al cual volver.
 * @param {boolean|null|undefined} esCliente
 * @returns {string} LOAN_SIM_STEPS.PHONE_VALIDATION | LOAN_SIM_STEPS.DNI_UPLOAD
 */
const getPrevStepFromReciboUpload = (esCliente) =>
  esCliente === true ? LOAN_SIM_STEPS.PHONE_VALIDATION : LOAN_SIM_STEPS.DNI_UPLOAD;

const BACK_BUTTON_STEPS = [
  LOAN_SIM_STEPS.IDENTITY_SELECTION,
  LOAN_SIM_STEPS.PHONE_VALIDATION,
  LOAN_SIM_STEPS.DNI_UPLOAD,
  LOAN_SIM_STEPS.RECIBO_UPLOAD,
  LOAN_SIM_STEPS.WELCOME,
  LOAN_SIM_STEPS.EN_ANALISIS,
  LOAN_SIM_STEPS.PHONE_PICKER,
];

export const useOnboardingFlow = () => {
  const [leadData, setLeadData] = useState(null);
  const [leadToken, setLeadToken] = useState(null);
  const [onboardingStep, setOnboardingStep] = useState(LOAN_SIM_STEPS.LEAD_REGISTRATION);
  const [restoringOnboarding, setRestoringOnboarding] = useState(false);
  const [pendingIdentities, setPendingIdentities] = useState(null);
  const [pendingDni, setPendingDni] = useState(null);
  const [pendingCelular, setPendingCelular] = useState(null);
  const [pendingSituacionLaboral, setPendingSituacionLaboral] = useState(null);
  const [rejectedFechaExpiracionBloqueo, setRejectedFechaExpiracionBloqueo] =
    useState(null);
  const [pickerContext, setPickerContext] = useState(null);

  const getLeadId = useCallback(() => {
    if (leadData?.leadId) return leadData.leadId;
    if (leadToken) {
      const decoded = getDecodedToken(leadToken);
      return decoded?.leadId ?? null;
    }
    return null;
  }, [leadData, leadToken]);
  useEffect(() => {
    const restoreOnboardingState = async () => {
      setRestoringOnboarding(true);
      try {
        const leadTokenValue = await getCookie(COOKIE_LEAD_TOKEN_CONFIG.NAME);
      
        if (!leadTokenValue) {
          setOnboardingStep(LOAN_SIM_STEPS.LEAD_REGISTRATION);
          setRestoringOnboarding(false);
          return;
        }

        // Decode the JWT token to extract leadId
        const decoded = getDecodedToken(leadTokenValue);
        if (!decoded || !decoded.leadId) {
          setRestoringOnboarding(false);
          return;
        }
        const leadId = decoded.leadId;

        if (!leadId) {
          setRestoringOnboarding(false);
          return;
        }

        const response = await LeadRegistrationService.obtenerEstadoOnboarding(leadId);
  
        if (response.success && response.data) {
          const estadoOnboarding = response.data.estado_onboarding;
         
          // Map onboarding state to loan sim step
          let targetStep = LOAN_SIM_STEPS.LEAD_REGISTRATION;
          if (estadoOnboarding === ONBOARDING_STATES.CELULAR_VALIDADO) {
            targetStep = LOAN_SIM_STEPS.DNI_UPLOAD;
          } else if (estadoOnboarding === ONBOARDING_STATES.LEAD_CREADO) {
            targetStep = LOAN_SIM_STEPS.PHONE_VALIDATION;
          } else if (estadoOnboarding === ONBOARDING_STATES.DNI_SUBIDO) {
            targetStep = LOAN_SIM_STEPS.RECIBO_UPLOAD;
          } else if (estadoOnboarding === ONBOARDING_STATES.RECIBO_SUBIDO || 
            estadoOnboarding === ONBOARDING_STATES.ONBOARDING_COMPLETO
          ) {
            targetStep = LOAN_SIM_STEPS.WELCOME;
          } else if (estadoOnboarding === ONBOARDING_STATES.RECHAZADO) {
            targetStep = LOAN_SIM_STEPS.RECHAZADO;
          } else if (estadoOnboarding === ONBOARDING_STATES.EN_ANALISIS) {
            targetStep = LOAN_SIM_STEPS.EN_ANALISIS;
          } else if (estadoOnboarding === ONBOARDING_STATES.PHONE_PICKER) {
            targetStep = LOAN_SIM_STEPS.PHONE_PICKER;
          }
          // Solo actualizar leadData si no tiene informacion completa (sin celular)
          if (leadData?.celular) {
            setLeadData(response.data);
          }
          // Mergear es_cliente para que navigateToPrev pueda decidir correctamente
          // cuando el usuario refresca en RECIBO_UPLOAD.
          if (response.data.es_cliente !== undefined) {
            setLeadData((prev) => ({
              ...(prev || {}),
              es_cliente: response.data.es_cliente,
            }));
          }
          setLeadToken(leadTokenValue);
          setOnboardingStep(targetStep);
        }
      } catch (err) {
        console.error("RESTORE_ONBOARDING_ERROR:", err);
        // Continue normally if restoration fails
      } finally {
        setRestoringOnboarding(false);
      }
    };
    restoreOnboardingState();
  }, []);

  const navigateToNext = useCallback((currentStep, extras = {}) => {
    let next;
    if (currentStep === LOAN_SIM_STEPS.PHONE_VALIDATION) {
      next = getNextStepAfterPhoneValidation(extras.esCliente);
    } else {
      next = NEXT_STEP_MAP[currentStep];
    }
    if (next) {
      setOnboardingStep(next);
    }
  }, []);

  const navigateToPrev = useCallback(async () => {
    // Para RECIBO_UPLOAD el prev depende de es_cliente:
    //   - cliente  → PHONE_VALIDATION (no hay DNI_UPLOAD al cual volver)
    //   - no cliente → DNI_UPLOAD (comportamiento histórico)
    const prev =
      onboardingStep === LOAN_SIM_STEPS.RECIBO_UPLOAD
        ? getPrevStepFromReciboUpload(leadData?.es_cliente)
        : PREV_STEP_MAP[onboardingStep];

    if (prev) {
      try {
        const leadId = getLeadId();
        const estadoMap = {
          [LOAN_SIM_STEPS.PHONE_VALIDATION]: "LEAD_CREADO",
          [LOAN_SIM_STEPS.DNI_UPLOAD]: "CELULAR_VALIDADO",
          [LOAN_SIM_STEPS.RECIBO_UPLOAD]: "DNI_SUBIDO",
          [LOAN_SIM_STEPS.WELCOME]: "RECIBO_SUBIDO",
        };
        const estadoBackendPrev = estadoMap[prev];

        // Solo sincronizar si hay un estado previo que actualizar
        if (leadId && estadoBackendPrev) {
          await LeadRegistrationService.actualizarEstadoOnboarding({
            leadId,
            estado: estadoBackendPrev,
          });
        }
      } catch (err) {
        console.error("Error al sincronizar estado de onboarding:", err);
      }
      // Limpiar pending de identidad cuando salimos del step IDENTITY_SELECTION
      // (no afecta el flujo normal donde se navega desde otros steps).
      if (onboardingStep === LOAN_SIM_STEPS.IDENTITY_SELECTION) {
        setPendingIdentities(null);
        setPendingDni(null);
        setPendingCelular(null);
        setPendingSituacionLaboral(null);
      }
      setOnboardingStep(prev);
    }
  }, [onboardingStep, getLeadId, leadData, setPendingIdentities, setPendingDni, setPendingCelular, setPendingSituacionLaboral]);

  const handleLeadSuccess = useCallback((data) => {

    if (data?.requiresIdentitySelection) {
      setPendingIdentities(data.identities);
      // Guardamos dni/celular de la sesión actual para poder re-llamar
      // a crearLead con selectedCuit.
      setPendingDni(data.dni ?? null);
      setPendingCelular(data.celular ?? null);
      setPendingSituacionLaboral(data.situacionLaboral ?? null);
      setOnboardingStep(LOAN_SIM_STEPS.IDENTITY_SELECTION);
      return;
    }
    setLeadData(data.lead);
    setLeadToken(data.token);

    // Siempre navegar a PHONE_VALIDATION después de crearLead exitoso
    setOnboardingStep(LOAN_SIM_STEPS.PHONE_VALIDATION);
  }, []);

  const handleRejected = useCallback((fechaExpiracionBloqueo = null) => {
    setLeadData(null);
    setLeadToken(null);
    setRejectedFechaExpiracionBloqueo(fechaExpiracionBloqueo);
    setOnboardingStep(LOAN_SIM_STEPS.RECHAZADO);
  }, []);

  const handleAnalysis = useCallback((data) => {
    if (data?.lead) setLeadData(data.lead);
    if (data?.token) setLeadToken(data.token);
    setOnboardingStep(LOAN_SIM_STEPS.EN_ANALISIS);
  }, []);

  const handleIdentitySelected = useCallback(
    async (selectedCuit) => {
      // Re-llamar a crearLead con el CUIT seleccionado para generar el lead con
      // un scoring fresco basado en la identidad elegida.
      // El DNI y celular los tenemos guardados en pendingDni/pendingCelular
      // desde la primera llamada (que devolvió requiresIdentitySelection).
      // Turnstile ya se validó en la primera llamada; el controller salta
      // la verificación cuando selectedCuit está presente (ver Task 12 del plan).
      const turnstileTokenPlaceholder = "reenrollment-placeholder";

      const response = await LeadRegistrationService.crearLead({
        dni: pendingDni,
        turnstileToken: turnstileTokenPlaceholder,
        huella_dispositivo: null,
        request_id: null,
        celular: pendingCelular,
        selectedCuit,
        term_y_cond: true,
        situacion_laboral: pendingSituacionLaboral,
      });

      if (response.success && response.data) {
        setPendingIdentities(null);
        setPendingDni(null);
        setPendingCelular(null);
        setPendingSituacionLaboral(null);
        await setCookie(
          COOKIE_LEAD_TOKEN_CONFIG.NAME,
          response.data.token,
          COOKIE_LEAD_TOKEN_CONFIG.EXPIRY_MS,
        );
        setLeadData(response.data.lead);
        setLeadToken(response.data.token);

        setOnboardingStep(LOAN_SIM_STEPS.PHONE_VALIDATION);
        return { success: true };
      }

      // El back siempre devuelve HTTP 200 (incluso en errores — el status real
      // viene en el body). Detectamos el rechazo por causa:
      //   - SITUACION_LABORAL_NO_ELEGIBLE → el gate sigue rechazando con la
      //     identidad seleccionada (ej: si selectedCuit matcheó un fallecido
      //     o si la sit. laboral no es elegible).
      //   - FALLECIDO → la identidad seleccionada es de un fallecido.
      //   - EDAD_INVALIDA / SCORING_RECHAZADO → también son rechazos.
      // En cualquier caso de rechazo, navega al RejectedStep. Si NO es un
      // rechazo conocido, devolvemos el error para que OnboardingFlowScreen
      // lo muestre en el slot de error del IdentitySelectionStep.
      if (
        response.cause === ERROR_CAUSE.SITUACION_LABORAL_NO_ELEGIBLE ||
        response.cause === ERROR_CAUSE.FALLECIDO ||
        response.cause === ERROR_CAUSE.EDAD_INVALIDA ||
        response.cause === ERROR_CAUSE.SCORING_RECHAZADO ||
        response.cause === ERROR_CAUSE.LEAD_REGISTRATION_RECHAZADO_RECIENTE
      ) {
        handleRejected(response.data?.fecha_expiracion_bloqueo ?? null);
        return { success: false, rejected: true };
      }

      return {
        success: false,
        error: response.message || "No pudimos procesar tu selección",
      };
    },
    [pendingDni, pendingCelular, pendingSituacionLaboral, handleRejected],
  );

  const goToAnalysis = useCallback(() => {
    setOnboardingStep(LOAN_SIM_STEPS.EN_ANALISIS);
  }, []);

  const resetOnboarding = useCallback(() => {
    setLeadData(null);
    setLeadToken(null);
    setOnboardingStep(LOAN_SIM_STEPS.LEAD_REGISTRATION);
  }, []);

  /**
   * Limpia el contexto del picker (options+target) y vuelve al step de
   * validación de celular. Se usa cuando el usuario pulsa "Volver" desde
   * PhonePickerStep.
   */
  const handlePickerResolved = useCallback(() => {
    setPickerContext(null);
    setOnboardingStep(LOAN_SIM_STEPS.PHONE_VALIDATION);
  }, []);

  /**
   * Orquesta el submit del picker y la navegación forward.
   * El caller pasa `submitPick` (de usePhonePicker) para mantener la lógica
   * de presentación fuera de este hook (per convention `manual-validation-tags`).
   *  - Success (data es_cliente true|false): navega a RECIBO_UPLOAD | DNI_UPLOAD.
   *  - Failure o already-attempted: no navega; el caller (PhonePickerStep)
   *    mantiene el mensaje de error en pantalla vía el `error` state del hook
   *    de presentación.
   */
  const handlePickerPick = useCallback(
    async (submitPick, opcionElegida) => {
      const result = await submitPick(opcionElegida);
      if (!result?.success) {
        return result;
      }
   
      const decision = result.data?.decision;
      if (decision?.estado === "RECHAZADO") {
        setPickerContext(null);
        handleRejected(decision.motivoRechazo ?? null);
        return result;
      }
      const esCliente = result.data?.es_cliente ?? leadData?.es_cliente;
      const next = getNextStepAfterPhoneValidation(esCliente);
      setPickerContext(null);
      setOnboardingStep(next);
      return result;
    },
    [leadData, handleRejected],
  );

  /**
   * Persiste el contexto del picker y navega al step PHONE_PICKER.
   * Lo llama OnboardingFlowScreen cuando el back devuelve el shape
   * `requiresPhonePicker` desde verificarOTPCelular.
   */
  const handlePickerTriggered = useCallback(({ options, target }) => {
    setPickerContext({ options: options ?? [], target: target ?? null });
    setOnboardingStep(LOAN_SIM_STEPS.PHONE_PICKER);
  }, []);

  const getScoringId = useCallback(() => {
    if (leadData?.id_scoring) {
      return String(leadData.id_scoring);
    }
    if (leadToken) {
      const decoded = getDecodedToken(leadToken);
      return decoded?.scoringId ? String(decoded.scoringId) : null;
    }
    return null;
  }, [leadData, leadToken]);

  const shouldShowBackButton = useCallback(() => {
    return BACK_BUTTON_STEPS.includes(onboardingStep);
  }, [onboardingStep]);

  return {
    // Estado
    leadData,
    leadToken,
    onboardingStep,
    restoringOnboarding,
    pendingIdentities,
    rejectedFechaExpiracionBloqueo,
    pickerContext,
    setPickerContext,

    // Navegación
    navigateToNext,
    navigateToPrev,
    resetOnboarding,

    // Handlers de steps
    handleLeadSuccess,
    handleRejected,
    handleAnalysis,
    goToAnalysis,
    handleIdentitySelected,
    handlePickerResolved,
    handlePickerTriggered,
    handlePickerPick,

    // Utilidad
    getLeadId,
    getScoringId,
    shouldShowBackButton,
  };
};
