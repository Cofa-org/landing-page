import { useCallback, useMemo, useState } from "react";
import LeadRegistrationService from "../../../services/leadRegistrationService.js";

const WELCOME_IMAGES = [
  "/img/welcome_growth_opportunity.webp",
  "/img/welcome_trust_partnership.webp",
  "/img/welcome_success_celebration.webp",
];

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

  // Imagen random estable durante toda la vida del hook.
  // Se re-sortea cada vez que el componente que usa el hook se monta de nuevo.
  const welcomeImage = useMemo(
    () => WELCOME_IMAGES[Math.floor(Math.random() * WELCOME_IMAGES.length)],
    [],
  );

  return { handleWelcomeComplete, onboardingCompletado, welcomeImage };
};
