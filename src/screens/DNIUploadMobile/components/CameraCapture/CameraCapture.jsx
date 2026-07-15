import React, { useEffect, useRef, useState } from "react";
import { FaCamera, FaCheck, FaTimes } from "react-icons/fa";
import { useCameraCapture } from "../../hooks/useCameraCapture";
import { checkResolution } from "../../hooks/useQualityCheck";
import { ERROR_MESSAGE } from "../../../../constants/camera.constants.js";
import styles from "./CameraCapture.module.css";

const CameraCapture = ({ open, onCapture, onCancel, tipoFoto }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { stream, isStarting, error, startCamera, stopCamera, captureFrame } = useCameraCapture();
  const [phase, setPhase] = useState("idle"); // idle | streaming | capturing | error | preview
  const [previewBlob, setPreviewBlob] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    return () => {
      stopCamera();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [stopCamera, previewUrl]);

  useEffect(() => {
    if (!open) return;
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream, open]);

  const handleStart = async () => {
    setValidationError("");
    try {
      await startCamera();
      setPhase("streaming");
    } catch {
      setPhase("error");
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current) return;
    setPhase("capturing");
    setValidationError("");

    const resolutionCheck = checkResolution(videoRef.current);
    if (!resolutionCheck.ok) {
      setValidationError(resolutionCheck.message);
      setPhase("streaming");
      return;
    }

    const blob = await captureFrame(videoRef.current, canvasRef.current);
    const url = URL.createObjectURL(blob);
    setPreviewBlob(blob);
    setPreviewUrl(url);
    setPhase("preview");
    stopCamera();
  };

  const handleConfirm = () => {
    onCapture(previewBlob);
  };

  const handleRetry = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewBlob(null);
    setPreviewUrl("");
    setValidationError("");
    setPhase("idle");
  };

  const handleClose = () => {
    stopCamera();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    onCancel();
  };

  if (!open) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <button type="button" className={styles.closeBtn} onClick={handleClose}>
          <FaTimes />
        </button>

        <h3 className={styles.title}>Sacar foto del {tipoFoto}</h3>

        {phase === "idle" && (
          <div className={styles.idleContainer}>
            <FaCamera className={styles.idleIcon} />
            <p className={styles.idleText}>Tocá el botón para activar la cámara</p>
            {error && <p className={styles.error}>{error}</p>}
            <button type="button" className={styles.primaryBtn} onClick={handleStart}>
              Activar cámara
            </button>
          </div>
        )}

        {(phase === "streaming" || phase === "capturing") && (
          <div className={styles.videoContainer}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={styles.video}
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />
            <div className={styles.overlay}>
              <div className={styles.guideRect} />
              <p className={styles.guideText}>Encuadrá tu DNI dentro del rectángulo</p>
            </div>
            {validationError && <p className={styles.error}>{validationError}</p>}
            <button
              type="button"
              className={styles.captureBtn}
              onClick={handleCapture}
              disabled={phase === "capturing"}
            >
              {phase === "capturing" ? "Procesando..." : "Capturar"}
            </button>
          </div>
        )}

        {phase === "preview" && (
          <div className={styles.previewContainer}>
            <img src={previewUrl} alt="Preview" className={styles.previewImage} />
            <div className={styles.previewActions}>
              <button type="button" className={styles.secondaryBtn} onClick={handleRetry}>
                Reintentar
              </button>
              <button type="button" className={styles.primaryBtn} onClick={handleConfirm}>
                <FaCheck /> Confirmar
              </button>
            </div>
          </div>
        )}

        {phase === "error" && (
          <div className={styles.idleContainer}>
            <p className={styles.error}>{error}</p>
            <button type="button" className={styles.primaryBtn} onClick={handleStart}>
              Reintentar
            </button>
          </div>
        )}

        {isStarting && <p className={styles.loading}>Iniciando cámara...</p>}
      </div>
    </div>
  );
};

export default CameraCapture;