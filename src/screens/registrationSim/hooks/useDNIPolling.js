import { useCallback, useEffect, useRef, useState } from "react";
import LeadRegistrationService from "../../../services/leadRegistrationService.js";
import { ONBOARDING_STATES } from "../../../constants/LOAN_SIM.js";
import { dniError, normalizeDniError, validDniContext, validDniUuid } from "../../../lib/dni-capture.js";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 100;

export const useDNIPolling = (leadId, token, expectedContext) => {
  const [isPolling, setIsPolling] = useState(false);
  const [pollingError, setPollingError] = useState("");
  const lifecycle = useRef({ generation: 0, timer: null, controller: null });
  const solicitudId = expectedContext?.solicitudId;
  const captureSessionId = expectedContext?.captureSessionId;
  const baseRevision = expectedContext?.baseRevision;

  const stopPolling = useCallback(() => {
    const life = lifecycle.current;
    life.generation += 1;
    clearTimeout(life.timer);
    life.controller?.abort();
    setIsPolling(false);
  }, []);

  const startPolling = useCallback((onReceived) => {
    stopPolling();
    if (!leadId || !token || !validDniContext({ solicitudId, captureSessionId, baseRevision })) return;
    const life = lifecycle.current;
    const generation = life.generation;
    let queries = 0;
    setPollingError("");
    setIsPolling(true);
    const active = () => generation === life.generation;
    const poll = async () => {
      if (!active()) return;
      const controller = new AbortController();
      life.controller = controller;
      queries += 1;
      try {
        const response = await LeadRegistrationService.obtenerContextoDni(leadId, { tokenOverride: token, signal: controller.signal });
        if (!active()) return;
        if (response?.success === false) throw normalizeDniError(response);
        const snapshot = response?.data;
        if (!validDniContext(snapshot) || !Object.values(ONBOARDING_STATES).includes(snapshot.estado_onboarding)
          || typeof snapshot.canCapture !== "boolean" || typeof snapshot.dniReceivedForSession !== "boolean"
          || !["current_session", "legacy", "none"].includes(snapshot.receiptKind)) throw dniError("DNI_TECHNICAL_ERROR");
        if (snapshot.solicitudId !== solicitudId || snapshot.captureSessionId !== captureSessionId) throw dniError("DNI_CAPTURE_CONTEXT_CHANGED");
        const received = snapshot.dniReceivedForSession && snapshot.receiptKind === "current_session" && validDniUuid(snapshot.receivedUploadId);
        if (received || !snapshot.canCapture) {
          stopPolling();
          onReceived?.({ received: Boolean(received) });
          return;
        }
        if (snapshot.baseRevision !== baseRevision) throw dniError("DNI_CAPTURE_CONTEXT_CHANGED");
      } catch (failure) {
        if (!active() || controller.signal.aborted) return;
        stopPolling();
        setPollingError(normalizeDniError(failure).message);
        return;
      }
      if (!active()) return;
      if (queries >= MAX_POLLS) {
        stopPolling();
        setPollingError("No detectamos nuevas fotos. Revisá tu celular y actualizá la captura para volver a consultar.");
        return;
      }
      life.timer = setTimeout(poll, POLL_INTERVAL_MS);
    };
    life.timer = setTimeout(poll, POLL_INTERVAL_MS);
  }, [leadId, token, solicitudId, captureSessionId, baseRevision, stopPolling]);

  useEffect(() => {
    const life = lifecycle.current;
    setIsPolling(false);
    setPollingError("");
    return () => {
      life.generation += 1;
      clearTimeout(life.timer);
      life.controller?.abort();
    };
  }, [leadId, token, solicitudId, captureSessionId, baseRevision]);

  return { isPolling, pollingError, startPolling, stopPolling };
};
