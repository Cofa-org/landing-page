import { useState, useCallback } from "react";
import LeadRegistrationService from "../../../services/leadRegistrationService";
import { getFriendlyErrorMessage } from "../../../lib/network-error";

const SUBIR_RECIBO_RETRY_CONFIG = { retries: 1, backoffMs: 1500 };

export const useReciboUpload = () => {
  const [reciboFile, setReciboFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    setReciboFile(file);
    setPreview(URL.createObjectURL(file));
    setUploadError("");
  }, []);

  const clearFile = useCallback(() => {
    setReciboFile(null);
    setPreview(null);
    setUploadError("");
  }, []);

  const subirRecibo = useCallback(async (leadId) => {
    if (!reciboFile) return { success: false, error: "El recibo de sueldo es requerido" };
    if (!leadId) return { success: false, error: "Lead no encontrado" };

    setIsUploading(true);
    setUploadError("");

    try {
      const response = await LeadRegistrationService.subirRecibo(
        { leadId },
        reciboFile,
        null,
        SUBIR_RECIBO_RETRY_CONFIG,
      );
      if (response.success) {
        // Propagar la fila final del lead para que ReciboUploadStep pueda inspeccionar
        // estado_onboarding y enrutar a EN_ANALISIS si el back transicionó allí.
        return { success: true, data: response.data };
      }
      const msg = response.message ? `${response.message} 😊` : "Error al subir el recibo";
      setUploadError(msg);
      return { success: false, error: msg };
    } catch (err) {
      const msg = `${getFriendlyErrorMessage(err)} 😊`;
      setUploadError(msg);
      return { success: false, error: msg };
    } finally {
      setIsUploading(false);
    }
  }, [reciboFile]);

  const isFormValid = !!reciboFile;
  const isImage = reciboFile ? reciboFile.type.startsWith("image/") : false;

  return {
    reciboFile,
    preview,
    isUploading,
    uploadError,
    isFormValid,
    isImage,
    handleFileChange,
    clearFile,
    subirRecibo,
  };
};
