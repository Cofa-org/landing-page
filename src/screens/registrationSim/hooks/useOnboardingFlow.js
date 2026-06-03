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
  [LOAN_SIM_STEPS.LEAD_REGISTRATION]: LOAN_SIM_STEPS.DNI_UPLOAD,
  [LOAN_SIM_STEPS.DNI_UPLOAD]: LOAN_SIM_STEPS.RECIBO_UPLOAD,
  [LOAN_SIM_STEPS.RECIBO_UPLOAD]: LOAN_SIM_STEPS.WELCOME,
};

const PREV_STEP_MAP = {
  [LOAN_SIM_STEPS.WELCOME]: LOAN_SIM_STEPS.RECIBO_UPLOAD,
  [LOAN_SIM_STEPS.RECIBO_UPLOAD]: LOAN_SIM_STEPS.DNI_UPLOAD,
  [LOAN_SIM_STEPS.DNI_UPLOAD]: LOAN_SIM_STEPS.LEAD_REGISTRATION,
};

const BACK_BUTTON_STEPS = [
  LOAN_SIM_STEPS.DNI_UPLOAD,
  LOAN_SIM_STEPS.RECIBO_UPLOAD,
  LOAN_SIM_STEPS.WELCOME,
];

export const useOnboardingFlow = (onComplete) => {
  const [leadData, setLeadData] = useState(null);
  const [leadToken, setLeadToken] = useState(null);
  const [onboardingStep, setOnboardingStep] = useState(LOAN_SIM_STEPS.LEAD_REGISTRATION);
  const [restoringOnboarding, setRestoringOnboarding] = useState(false);

  const getLeadId = useCallback(() => {
    return leadData?.leadId ?? null;
  }, [leadData]);

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
        console.log(decoded);
        const response = await LeadRegistrationService.obtenerEstadoOnboarding(leadId);
console.log("Estado de onboarding obtenido:", response);
        if (response.success && response.data) {
          const estadoOnboarding = response.data.estado_onboarding;
       
          // Map onboarding state to loan sim step
          let targetStep = LOAN_SIM_STEPS.LEAD_REGISTRATION;
          if (estadoOnboarding === ONBOARDING_STATES.LEAD_CREADO) {
            targetStep = LOAN_SIM_STEPS.DNI_UPLOAD;
          } else if (estadoOnboarding === ONBOARDING_STATES.DNI_SUBIDO) {
            targetStep = LOAN_SIM_STEPS.RECIBO_UPLOAD;
          } else if (estadoOnboarding === ONBOARDING_STATES.RECIBO_SUBIDO) {
            targetStep = LOAN_SIM_STEPS.WELCOME;
          } else if (estadoOnboarding === ONBOARDING_STATES.ONBOARDING_COMPLETO) {
            targetStep = LOAN_SIM_STEPS.SIMULACION;
          } else if (estadoOnboarding === ONBOARDING_STATES.RECHAZADO) {
            targetStep = LOAN_SIM_STEPS.RECHAZADO;
          }

          if (response.data) {
            setLeadData(response.data);
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

  const navigateToNext = useCallback((currentStep) => {
    const next = NEXT_STEP_MAP[currentStep];
    if (next) {
      setOnboardingStep(next);
    }
  }, []);
 
  const navigateToPrev = useCallback(async () => {
    const prev = PREV_STEP_MAP[onboardingStep];

    if (prev) {
      try {
        const leadId = getLeadId();
        if (leadId) {
          const estadoMap = {
            [LOAN_SIM_STEPS.DNI_UPLOAD]: "LEAD_CREADO",
            [LOAN_SIM_STEPS.RECIBO_UPLOAD]: "DNI_SUBIDO",
            [LOAN_SIM_STEPS.WELCOME]: "RECIBO_SUBIDO",
          };
          const estadoBackendPrev = estadoMap[prev];

            await LeadRegistrationService.actualizarEstadoOnboarding({
              leadId,
              estado: estadoBackendPrev ? estadoBackendPrev : null,
            });
       
        }
      } catch (err) {
        console.error("Error al sincronizar estado de onboarding:", err);
      }
      setOnboardingStep(prev);
    }
  }, [onboardingStep, getLeadId]);

  const handleLeadSuccess = useCallback((data) => {
    setLeadData(data.lead);
    setLeadToken(data.token);
  }, []);

  const handleRejected = useCallback(() => {
    console.log("Lead rechazado, reseteando onboarding");
    setLeadData(null);
    setLeadToken(null);
    setOnboardingStep(LOAN_SIM_STEPS.RECHAZADO);
  
  }, []);

  const handleWelcomeComplete = useCallback(() => {
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

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
    handleWelcomeComplete,

    // Utilidad
    getLeadId,
    getScoringId,
    shouldShowBackButton,
  };
};
