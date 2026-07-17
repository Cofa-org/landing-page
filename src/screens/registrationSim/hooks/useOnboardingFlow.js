import { useState, useCallback, useEffect } from "react";
import { LOAN_SIM_STEPS, ONBOARDING_STATES } from "../../../constants/LOAN_SIM.js";
import { getCookie, setCookie } from "../../../lib/utils.js";
import { COOKIE_LEAD_TOKEN_CONFIG } from "../../../constants/LOAN_SIM.js";
import { getDecodedToken } from "../../../lib/token.js";
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
  // RECIBO_UPLOAD → se decide dinámicamente en navigateToPrev según es_cliente.
  [LOAN_SIM_STEPS.WELCOME]: LOAN_SIM_STEPS.RECIBO_UPLOAD,
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
  LOAN_SIM_STEPS.PHONE_VALIDATION,
  LOAN_SIM_STEPS.DNI_UPLOAD,
  LOAN_SIM_STEPS.RECIBO_UPLOAD,
  LOAN_SIM_STEPS.WELCOME,
];

export const useOnboardingFlow = () => {
  const [leadData, setLeadData] = useState(null);
  const [leadToken, setLeadToken] = useState(null);
  const [onboardingStep, setOnboardingStep] = useState(LOAN_SIM_STEPS.LEAD_REGISTRATION);
  const [restoringOnboarding, setRestoringOnboarding] = useState(false);

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
      setOnboardingStep(prev);
    }
  }, [onboardingStep, getLeadId, leadData]);

  const handleLeadSuccess = useCallback((data) => {

    setLeadData(data.lead);
    setLeadToken(data.token);
    // Siempre navegar a PHONE_VALIDATION después de crearLead exitoso
    setOnboardingStep(LOAN_SIM_STEPS.PHONE_VALIDATION);
  }, []);

  const handleRejected = useCallback(() => {
    setLeadData(null);
    setLeadToken(null);
    setOnboardingStep(LOAN_SIM_STEPS.RECHAZADO);
  }, []);

  const handleAnalysis = useCallback((data) => {
    if (data?.lead) setLeadData(data.lead);
    if (data?.token) setLeadToken(data.token);
    setOnboardingStep(LOAN_SIM_STEPS.EN_ANALISIS);
  }, []);

  const goToAnalysis = useCallback(() => {
    setOnboardingStep(LOAN_SIM_STEPS.EN_ANALISIS);
  }, []);

  const resetOnboarding = useCallback(() => {
    setLeadData(null);
    setLeadToken(null);
    setOnboardingStep(LOAN_SIM_STEPS.LEAD_REGISTRATION);
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

    // Navegación
    navigateToNext,
    navigateToPrev,
    resetOnboarding,

    // Handlers de steps
    handleLeadSuccess,
    handleRejected,
    handleAnalysis,
    goToAnalysis,

    // Utilidad
    getLeadId,
    getScoringId,
    shouldShowBackButton,
  };
};
