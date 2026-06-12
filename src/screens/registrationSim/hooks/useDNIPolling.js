import { useState, useCallback, useRef, useEffect } from "react";
import LeadRegistrationService from "../../../services/leadRegistrationService";
import { ONBOARDING_STATES } from "../../../constants/LOAN_SIM.js";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 100; // 100 × 3s = 5 minutos

export const useDNIPolling = (leadId, token) => {
  const [isPolling, setIsPolling] = useState(false);
  const [pollingError, setPollingError] = useState("");
  const intervalRef = useRef(null);
  const pollCountRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const startPolling = useCallback((onSuccess) => {
    if (!leadId || !token) return;

    stopPolling();
    setPollingError("");
    pollCountRef.current = 0;
    setIsPolling(true);

    intervalRef.current = setInterval(async () => {
      pollCountRef.current += 1;

      if (pollCountRef.current >= MAX_POLLS) {
        stopPolling();
        setPollingError("No se detectó la subida. Revisá tu celular o intentá de nuevo.");
        return;
      }

      try {
        const response = await LeadRegistrationService.obtenerEstadoOnboarding(leadId);
        if (response?.success && response?.data?.estado_onboarding === ONBOARDING_STATES.DNI_SUBIDO) {
          stopPolling();
          if (onSuccess) onSuccess();
        }
      } catch (err) {
        console.warn("Polling error:", err.message);
      }
    }, POLL_INTERVAL_MS);
  }, [leadId, token, stopPolling]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    isPolling,
    pollingError,
    startPolling,
    stopPolling,
  };
};
