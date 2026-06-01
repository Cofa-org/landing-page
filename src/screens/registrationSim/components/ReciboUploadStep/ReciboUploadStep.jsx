import React, { memo } from "react";
import PropTypes from "prop-types";
import { FaCamera, FaCheck } from "react-icons/fa";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import GenericForm from "../../../../Components/Forms/GenericForm/GenericForm.jsx";
import { useReciboUpload } from "../../hooks/useReciboUpload.js";
import styles from "./ReciboUploadStep.module.css";

const ReciboUploadStep = ({ leadId, onSuccess, loading, error: externalError }) => {
  const {
    preview,
    isUploading,
    uploadError,
    isFormValid,
    handleFileChange,
    clearFile,
    subirRecibo,
  } = useReciboUpload();

  const isLoading = loading || isUploading;
  const displayError = uploadError || externalError;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await subirRecibo(leadId);
    if (result.success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <GenericForm
      title="Subí tu recibo de sueldo"
      description="Necesitamos una foto clara de tu recibo de sueldo para verificar tu capacidad de pago."
      onSubmit={handleSubmit}
      className={styles.formTemplateContainer}
      children_className={styles.formTemplate}
    >

      <div className={styles.uploadAreaWrapper}>
        {preview ? (
          <div className={styles.preview}>
            <img src={preview} alt="Recibo de sueldo" />
            <span className={styles.checkIcon}><FaCheck /></span>
            <button type="button" className={styles.retakeBtn} onClick={clearFile}>Cambiar</button>
          </div>
        ) : (
          <label className={styles.uploadArea}>
            <FaCamera className={styles.cameraIcon} />
            <span>Tocar para subir</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className={styles.fileInput}
            />
          </label>
        )}
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

ReciboUploadStep.propTypes = {
  leadId: PropTypes.number,
  onSuccess: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.string,
};

export default memo(ReciboUploadStep);