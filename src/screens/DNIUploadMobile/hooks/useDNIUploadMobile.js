import { useState, useCallback } from "react";
import LeadRegistrationService from "./../../../services/leadRegistrationService.js";
import { getFriendlyErrorMessage } from "../../../lib/network-error.js";

const SUBIR_DNI_MOBILE_RETRY_CONFIG = { retries: 1, backoffMs: 1500 };

export const useDNIUploadMobile = (leadId, token) => {
  const [dniFront, setDniFront] = useState(null);
  const [dniBack, setDniBack] = useState(null);
  const [previewFront, setPreviewFront] = useState(null);
  const [previewBack, setPreviewBack] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleCapture = useCallback((blob, setFile, setPreview) => {
    if (!blob) return;
    setFile(blob);
    if (setPreview) {
      // Limpiar preview anterior si existe
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    }
    setUploadError("");
  }, []);

  const submitDNI = useCallback(async () => {
    if (!leadId || !dniFront || !dniBack) {
      setUploadError("Ambas fotos son requeridas");
      return { success: false };
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const response = await LeadRegistrationService.subirDniMobile(
        { leadId },
        { dniFront, dniBack },
        token,
        null,
        SUBIR_DNI_MOBILE_RETRY_CONFIG,
      );
      if (response.success) {
        setUploadSuccess(true);
        return { success: true };
      }
      setUploadError(response.message || "Error al subir las fotos");
      return { success: false };
    } catch (err) {
      setUploadError(getFriendlyErrorMessage(err));
      return { success: false };
    } finally {
      setIsUploading(false);
    }
  }, [leadId, dniFront, dniBack, token]);

  const isFormValid = dniFront && dniBack;

  return {
    dniFront,
    dniBack,
    previewFront,
    previewBack,
    isUploading,
    uploadError,
    uploadSuccess,
    isFormValid,
    handleCapture,
    submitDNI,
    setDniFront,
    setDniBack,
    setPreviewFront,
    setPreviewBack,
  };
};