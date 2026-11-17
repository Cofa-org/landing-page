import { useDniCapture } from "../../../hooks/useDniCapture.js";
import { validDniContext } from "../../../lib/dni-capture.js";

export const useDNIUploadMobile = (leadId, token, expectedContext) => {
  const hasLinkContext = typeof token === "string" && token.length > 0 && validDniContext(expectedContext);
  const capture = useDniCapture({ leadId: hasLinkContext ? leadId : null, tokenOverride: token, expectedContext });
  return {
    ...capture, dniFront: capture.captures.front?.blob ?? null, dniBack: capture.captures.back?.blob ?? null,
    previewFront: capture.captures.front?.previewUrl ?? null, previewBack: capture.captures.back?.previewUrl ?? null,
    submitDNI: capture.submitCaptures,
  };
};
