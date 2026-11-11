import { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDniCaptureScreen } from "../../../hooks/useDniCaptureScreen.js";
import { normalizeDniId, validDniContext } from "../../../lib/dni-capture.js";

export function useDniUploadMobileScreen() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const leadId = normalizeDniId(params.get("leadId"));
  const token = params.get("token");
  const expectedContext = {
    solicitudId: params.get("solicitudId"), captureSessionId: params.get("captureSessionId"), baseRevision: params.get("baseRevision"),
  };
  // Every QR entry must be bound before the shared model can read context.
  // Inline registration alone may start without an expected context.
  const hasLinkContext = leadId !== null && typeof token === "string" && token.trim().length > 0 && validDniContext(expectedContext);
  const capture = useDniCaptureScreen({ leadId: hasLinkContext ? leadId : null, token, expectedContext });
  const handleBack = useCallback(() => navigate("/registro-simulador"), [navigate]);
  return { ...capture, handleBack };
}
