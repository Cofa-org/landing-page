import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FaCamera, FaCheck, FaArrowLeft } from "react-icons/fa";
import { useDNIUploadMobile } from "./hooks/useDNIUploadMobile";
import styles from "./DNIUploadMobile.module.css";

const DNIUploadMobileScreen = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const leadId = searchParams.get("leadId");
  const token = searchParams.get("token");

  useEffect(() => {
    if (!leadId || !token) {
      navigate("/registro-simulador");
    }
  }, [leadId, token, navigate]);

  const {
    previewFront,
    previewBack,
    isUploading,
    uploadError,
    uploadSuccess,
    isFormValid,
    handleFileChange,
    submitDNI,
    setDniFront,
    setDniBack,
    setPreviewFront,
    setPreviewBack,
  } = useDNIUploadMobile(leadId, token);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitDNI();
  };

  if (uploadSuccess) {
    return (
      <div className={styles.successContainer}>
        <div className={styles.successContent}>
          <span className={styles.checkCircle}><FaCheck /></span>
          <h2 className={styles.successTitle}>¡Listo!</h2>
          <p className={styles.successText}>
            Ya podés volver a la PC para continuar con tu solicitud.
          </p>
          <p className={styles.successSubtext}>
            Tu solicitud se guardó automáticamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.backButton}
        onClick={() => navigate("/registro-simulador")}
      >
        <FaArrowLeft /> Volver
      </button>

      <div className={styles.header}>
        <h1 className={styles.title}>Subí las fotos de tu DNI</h1>
        <p className={styles.subtitle}>
          Necesitamos fotos claras de ambas caras de tu DNI para verificar tu identidad.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.uploadRow}>
          <div className={styles.uploadBox}>
            <label className={styles.label}>Frente del DNI</label>
            {previewFront ? (
              <div className={styles.preview}>
                <img src={previewFront} alt="Frente DNI" />
                <span className={styles.checkIcon}><FaCheck /></span>
                <button
                  type="button"
                  className={styles.retakeBtn}
                  onClick={() => { setDniFront(null); setPreviewFront(null); }}
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <label className={styles.uploadArea}>
                <FaCamera className={styles.cameraIcon} />
                <span>Tomá foto del frente</span>
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
                <button
                  type="button"
                  className={styles.retakeBtn}
                  onClick={() => { setDniBack(null); setPreviewBack(null); }}
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <label className={styles.uploadArea}>
                <FaCamera className={styles.cameraIcon} />
                <span>Tomá foto del dorso</span>
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

        {uploadError && (
          <p className={styles.error}>{uploadError}</p>
        )}

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={!isFormValid || isUploading}
        >
          {isUploading ? "Subiendo..." : "Subir fotos"}
        </button>
      </form>
    </div>
  );
};

export default DNIUploadMobileScreen;
