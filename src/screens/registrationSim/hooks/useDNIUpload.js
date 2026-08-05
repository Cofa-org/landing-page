import { useState, useCallback } from "react";
import LeadRegistrationService from "../../../services/leadRegistrationService";
import { getFriendlyErrorMessage } from "../../../lib/network-error";

const SUBIR_DNI_RETRY_CONFIG = { retries: 1, backoffMs: 1500 };

export const useDNIUpload = () => {
  const [dniFront, setDniFront] = useState(null);
  const [dniBack, setDniBack] = useState(null);
  const [previewFront, setPreviewFront] = useState(null);
  const [previewBack, setPreviewBack] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleFileChange = useCallback((e, setFile, setPreview) => {
    const file = e.target.files[0];
    if (!file) return;
    setFile(file);
    setPreview(URL.createObjectURL(file));
    setUploadError("");
  }, []);

  const clearFiles = useCallback(() => {
    setDniFront(null);
    setDniBack(null);
    setPreviewFront(null);
    setPreviewBack(null);
    setUploadError("");
  }, []);

  const subirDNI = useCallback(async (leadId) => {
        if (!leadId) return { success: false, error: "Lead no encontrado" };
    if (!dniFront || !dniBack) return { success: false, error: "Ambas caras del DNI son requeridas" };

    setIsUploading(true);
    setUploadError("");

    try {
      const response = await LeadRegistrationService.subirDni(
        { leadId },
        { dniFront, dniBack },
        null,
        SUBIR_DNI_RETRY_CONFIG,
      );
      if (response.success) {
        return { success: true };
      }
      const msg = response.message ? `${response.message} 😊` : "Error al subir el DNI";
      setUploadError(msg);
      return { success: false, error: msg };
    } catch (err) {
      const msg = `${getFriendlyErrorMessage(err)} 😊`;
      setUploadError(msg);
      return { success: false, error: msg };
    } finally {
      setIsUploading(false);
    }
  }, [dniFront, dniBack]);

  const isFormValid = dniFront && dniBack;

  return {
    dniFront,
    dniBack,
    previewFront,
    previewBack,
    isUploading,
    uploadError,
    isFormValid,
    handleFileChange,
    clearFiles,
    subirDNI,
    setDniFront,
    setDniBack,
    setPreviewFront,
    setPreviewBack,
  };
};