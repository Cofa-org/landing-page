import React, { memo } from "react";
import PropTypes from "prop-types";
import { FaCamera, FaCheck } from "react-icons/fa";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import GenericForm from "../../../../Components/Forms/GenericForm/GenericForm.jsx";
import { useDNIUpload } from "../../hooks/useDNIUpload.js";
import styles from "./DNIUploadStep.module.css";

const DNIUploadStep = ({ leadId, onSuccess, loading, error: externalError }) => {
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

  const isLoading = loading || isUploading;
  const displayError = uploadError || externalError;
  console.log("leadId", leadId);
  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await subirDNI(leadId);
    if (result.success && onSuccess) {
      onSuccess();
    }
  };

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
};

DNIUploadStep.propTypes = {
  leadId: PropTypes.number,
  onSuccess: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.string,
};

export default memo(DNIUploadStep);