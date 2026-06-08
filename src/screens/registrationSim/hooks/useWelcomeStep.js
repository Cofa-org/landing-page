import { useCallback } from "react";
import LeadRegistrationService from "../../../services/leadRegistrationService.js";

export const useWelcomeStep = () => {
  const handleWelcomeComplete = useCallback(async (leadId) => {
    try {
      if (leadId) {
        const result = await LeadRegistrationService.onBoardingCompleto(leadId);
        if (result.success) {
          window.open("http://wa.me/5491137570853", "_blank", "noopener,noreferrer");
        }
      }
    } catch (err) {
      console.error("Error al completar onboarding:", err);
    }
  }, []);

  return { handleWelcomeComplete };
};
