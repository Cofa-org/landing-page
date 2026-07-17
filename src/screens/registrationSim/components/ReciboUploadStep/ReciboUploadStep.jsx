import React, { memo } from "react";
import PropTypes from "prop-types";
import { FaCamera, FaCheck, FaFilePdf } from "react-icons/fa";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import GenericForm from "../../../../Components/Forms/GenericForm/GenericForm.jsx";
import { useReciboUpload } from "../../hooks/useReciboUpload.js";
import { ONBOARDING_STATES } from "../../../../constants/LOAN_SIM.js";
import styles from "./ReciboUploadStep.module.css";

const ReciboUploadStep = ({ leadId, onSuccess, onAnalysisAfterRecibo, loading, error: externalError }) => {
  const {
    preview,
    isUploading,
    uploadError,
    isFormValid,
    isImage,
    handleFileChange,
    clearFile,
    subirRecibo,
  } = useReciboUpload();

  const isLoading = loading || isUploading;
  const displayError = uploadError || externalError;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await subirRecibo(leadId);
    if (result.success) {
      // Si el back transicionó el lead a EN_ANALISIS (porque requiere análisis),
      // navegamos a la pantalla de análisis. Si no, flujo normal.
      if (result.data?.estado_onboarding === ONBOARDING_STATES.EN_ANALISIS) {
        if (onAnalysisAfterRecibo) onAnalysisAfterRecibo(result.data);
      } else if (onSuccess) {
        onSuccess();
      }
    }
  };

  return (
    <GenericForm
      title='Subí tu recibo de sueldo'
      description='Necesitamos una foto clara de tu recibo de sueldo para verificar tu capacidad de pago.'
      onSubmit={handleSubmit}
      className={styles.formTemplateContainer}
      children_className={styles.formTemplate}
    >
      <div className={styles.uploadAreaWrapper}>
        {preview ? (
          <div className={styles.preview}>
            {isImage ? (
              <img
                src={preview}
                alt='Recibo de sueldo'
              />
            ) : (
              <div className={styles.pdfIcon}>
                <FaFilePdf />
                <span>PDF seleccionado</span>
              </div>
            )}
            <span className={styles.checkIcon}>
              <FaCheck />
            </span>
            <button
              type='button'
              className={styles.retakeBtn}
              onClick={clearFile}
            >
              Cambiar
            </button>
          </div>
        ) : (
          <label className={styles.uploadArea}>
            <FaCamera className={styles.cameraIcon} />
            <span>Tocar para subir</span>
            <input
              type='file'
              accept='image/*,application/pdf'
              capture='environment'
              onChange={handleFileChange}
              className={styles.fileInput}
            />
          </label>
        )}
      </div>

      {displayError && <p className={styles.error}>{displayError}</p>}

      <GenericButton
        type='submit'
        loading={isLoading}
        disabled={!isFormValid || isLoading}
      >
        Continuar
      </GenericButton>

      <GenericButton
        type='button'
        variant='secondary'
        onClick={() =>
          (window.location.href =
            "http://wa.me/5491137570853?text=Hola!!%20Necesito%20ayuda%20para%20subir%20mi%20recibo%20de%20sueldo!")
        }
      >
        Comunicarse con un asesor
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