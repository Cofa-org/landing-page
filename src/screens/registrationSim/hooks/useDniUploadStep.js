import { useDniCaptureScreen } from "../../../hooks/useDniCaptureScreen.js";

export function useDniUploadStep({ leadId, leadToken, onSuccess, loading, error }) {
  return useDniCaptureScreen({ leadId, token: leadToken, onSuccess, loading, externalError: error });
}
