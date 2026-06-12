import React, { memo, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { FaCamera, FaCheck } from "react-icons/fa";
import { QRCodeSVG } from "qrcode.react";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import GenericForm from "../../../../Components/Forms/GenericForm/GenericForm.jsx";
import { useDNIUpload } from "../../hooks/useDNIUpload.js";
import { useDNIPolling } from "../../hooks/useDNIPolling.js";
import styles from "./DNIUploadStep.module.css";

const BASE_URL = window.location.origin;

const DNIUploadStep = ({ leadId, leadToken, onSuccess, loading, error: externalError }) => {
  const {
    previewFront,
    previewBack,
    isUploading,
    uploadError,
    isFormValid,
    handleFileChange,
    subirDNI,
    setDniFront,
    setDniBack,
    setPreviewFront,
    setPreviewBack,
  } = useDNIUpload();

  const isMobileDevice = window.matchMedia("(pointer: coarse)").matches;

  const {
    isPolling,
    pollingError,
    startPolling,
    stopPolling,
  } = useDNIPolling(leadId, leadToken);

  const qrUrl = useMemo(() => {
    if (!leadId || !leadToken) return "";
    return `${BASE_URL}/subir-dni?leadId=${leadId}&token=${leadToken}`;
  }, [leadId, leadToken]);

  useEffect(() => {
    if (!isMobileDevice && leadId && leadToken) {
      startPolling(() => {
        if (onSuccess) onSuccess();
      });
    }
    return () => stopPolling();
  }, [isMobileDevice, leadId, leadToken, startPolling, stopPolling, onSuccess]);

  const isLoading = loading || isUploading;
  const displayError = pollingError || uploadError || externalError;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await subirDNI(leadId);
    if (result.success && onSuccess) {
      onSuccess();
    }
  };

  // Celular: input de cámara (comportamiento original)
  if (isMobileDevice) {
    return (
      <GenericForm
        title="Subí tu DNI"
        description="Necesitamos fotos claras de ambas caras de tu DNI para verificar tu identidad."
        onSubmit={handleSubmit}
        className={styles.formTemplateContainer}
        children_className={styles.formTemplate}
      >
        <div className={styles.uploadRow}>
          <div className={styles.uploadBox}>
            <label className={styles.label}>Frente del DNI</label>
            {previewFront ? (
              <div className={styles.preview}>
                <img src={previewFront} alt="Frente DNI" />
                <span className={styles.checkIcon}><FaCheck /></span>
                <button type="button" className={styles.retakeBtn} onClick={() => { setDniFront(null); setPreviewFront(null); }}>Cambiar</button>
              </div>
            ) : (
              <label className={styles.uploadArea}>
                <FaCamera className={styles.cameraIcon} />
                <span>Tocar para subir</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleFileChange(e, setDniFront, setPreviewFront)}
                  className={styles.fileInput}
                />
              </label>
            )}
          </div>

          <div className={styles.uploadBox}>
            <label className={styles.label}>Dorso del DNI</label>
            {previewBack ? (
              <div className={styles.preview}>
                <img src={previewBack} alt="Dorso DNI" />
                <span className={styles.checkIcon}><FaCheck /></span>
                <button type="button" className={styles.retakeBtn} onClick={() => { setDniBack(null); setPreviewBack(null); }}>Cambiar</button>
              </div>
            ) : (
              <label className={styles.uploadArea}>
                <FaCamera className={styles.cameraIcon} />
                <span>Tocar para subir</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleFileChange(e, setDniBack, setPreviewBack)}
                  className={styles.fileInput}
                />
              </label>
            )}
          </div>
        </div>

        {displayError && (
          <p className={styles.error}>{displayError}</p>
        )}

        <GenericButton
          type="submit"
          loading={isLoading}
          disabled={!isFormValid || isLoading}
        >
          Continuar
        </GenericButton>
      </GenericForm>
    );
  }

  // PC: muestra QR
  return (
    <GenericForm
      title="Subí tu DNI"
      description="Escaneá el código con tu celular para sacar las fotos de tu DNI."
      onSubmit={handleSubmit}
      className={styles.formTemplateContainer}
      children_className={styles.formTemplate}
    >
      <div className={styles.qrContainer}>
        {qrUrl ? (
          <QRCodeSVG value={qrUrl} size={180} className={styles.qrCode} />
        ) : (
          <div className={styles.qrPlaceholder}>Cargando código...</div>
        )}
        <p className={styles.qrInstruction}>
          Escaneá el código con tu celular para sacar las fotos de tu DNI.
        </p>
        {isPolling && (
          <p className={styles.pollingStatus}>
            Esperando que subas las fotos...
          </p>
        )}
      </div>

      {displayError && (
        <p className={styles.error}>{displayError}</p>
      )}

      <GenericButton
        type="submit"
        loading={isLoading}
        disabled={true}
      >
        Continuar
      </GenericButton>
    </GenericForm>
  );
};

DNIUploadStep.propTypes = {
  leadId: PropTypes.number,
  leadToken: PropTypes.string,
  onSuccess: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.string,
};

export default memo(DNIUploadStep);
