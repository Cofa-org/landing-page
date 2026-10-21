import { useCallback } from "react";
import { openCallbellWebchat } from "../../../utils/callbellHelpers.js";

/**
 * Hook del step `PENDING_CBU_VALIDATION` (Plan 2026-10-20).
 *
 * Encapsula la side-effect de abrir el chat de Callbell cuando el
 * cliente quiere hablar con un asesor.
 *
 * El "verificar estado" NO vive acá: el routing (PENDING → sigue,
 * RECHAZADO → pantalla de rechazo, CBU_VALIDATION → sigue el flujo)
 * lo hace `useLoanSimulator.verificarEstadoCBU`, que es el que tiene
 * `setStep` / `setRejectionReason` y el refresh de la simulación.
 *
 * @returns {{ handleContactAdvisor: () => void }}
 */
export const usePendingCbuValidation = () => {
  const handleContactAdvisor = useCallback(() => {
    try {
      openCallbellWebchat();
    } catch (err) {
      // El chat de Callbell puede no estar inyectado (dev sin GTM).
      // Nunca debe romper la pantalla: se loguea y se sigue.
      console.warn("No se pudo abrir el chat de Callbell:", err);
    }
  }, []);

  return { handleContactAdvisor };
};
