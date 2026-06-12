import { useCallback, useState } from "react";
import LeadRegistrationService from "../../../services/leadRegistrationService.js";

export const useWelcomeStep = () => {
  const [onboardingCompletado, setOnboardingCompletado] = useState(false);
  const handleWelcomeComplete = useCallback(async (leadId) => {
    try {
      if (leadId) {
        const result = await LeadRegistrationService.onBoardingCompleto(leadId);

        if (result.success) {
          window.open(
            "http://wa.me/5491137570853?text=Hola!%20Quiero%20mi%20pr%C3%A9stamo!!%20%3Ablush%3A",
            "_blank",
            "noopener,noreferrer",
          );
        }
        setOnboardingCompletado(true);
      }
    } catch (err) {
      console.error("Error al completar onboarding:", err);
    }
  }, []);

  return { handleWelcomeComplete, onboardingCompletado };
};
