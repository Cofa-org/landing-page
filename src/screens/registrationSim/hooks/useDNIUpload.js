import { useCallback } from "react";
import { useDniCapture } from "../../../hooks/useDniCapture.js";

export const useDNIUpload = (leadId, leadToken) => {
  const capture = useDniCapture({ leadId, tokenOverride: leadToken });
  const { clearCapture } = capture;
  const clearFiles = useCallback(() => {
    clearCapture("front");
    clearCapture("back");
  }, [clearCapture]);
  return {
    ...capture, dniFront: capture.captures.front?.blob ?? null, dniBack: capture.captures.back?.blob ?? null,
    previewFront: capture.captures.front?.previewUrl ?? null, previewBack: capture.captures.back?.previewUrl ?? null,
    subirDNI: capture.submitCaptures, clearFiles,
  };
};
