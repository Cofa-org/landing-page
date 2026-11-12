import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import { useCameraCaptureDialog } from "../../hooks/useCameraCaptureDialog.js";
import styles from "./CameraCapture.module.css";

export default function CameraCapture({ open, onCapture, onCancel, tipoFoto }) {
  const dialog = useCameraCaptureDialog({ open, tipoFoto, onConfirm: onCapture, onCancel });
  if (!open) return null;
  return (
    <div className={styles.modalOverlay}>
      <div ref={dialog.modalRef} className={styles.modal} role="dialog" aria-modal="true" aria-labelledby={dialog.titleId} tabIndex={-1}>
        <button type="button" className={styles.closeBtn} aria-label="Cerrar cámara" onClick={dialog.handleClose}>×</button>
        <h3 className={styles.title} id={dialog.titleId}>{dialog.title}</h3>
        {dialog.showRetry ? <div className={styles.cameraRecovery}>
          <GenericButton onClick={dialog.handleStart}>Reintentar cámara</GenericButton>
        </div> : null}
        {dialog.showStream ? <>
          <div className={styles.videoContainer}>
            <video ref={dialog.videoRef} autoPlay playsInline muted className={styles.video} />
            <div className={styles.overlay} aria-hidden="true"><div className={styles.guideRect} /></div>
          </div>
          <GenericButton onClick={dialog.handleCapture} disabled={dialog.isCapturing}>{dialog.captureLabel}</GenericButton>
        </> : null}
        <canvas ref={dialog.canvasRef} hidden />
        {dialog.phase === "preview" ? <div className={styles.previewContainer}>
          <div className={styles.previewScroll} data-expanded={dialog.expanded}>
            <div className={styles.previewFrame} style={dialog.previewFrameStyle}>
              <img src={dialog.previewUrl} alt={dialog.previewAlt} className={styles.previewImage} style={dialog.previewImageStyle} />
            </div>
          </div>
          <div className={styles.previewActions}>
            <GenericButton variant="secondary" onClick={dialog.handleRotate}>Girar 90°</GenericButton>
            <GenericButton variant="secondary" onClick={dialog.handleZoom} aria-expanded={dialog.expanded}>{dialog.zoomLabel}</GenericButton>
          </div>
          <p>Revisá la foto completa antes de usarla.</p>
          <div className={styles.previewActions}>
            <GenericButton variant="secondary" onClick={dialog.handleRetry}>Volver a sacar</GenericButton>
            <GenericButton onClick={dialog.handleConfirm}>Usar esta foto</GenericButton>
          </div>
        </div> : null}
        <div aria-live="polite">
          {dialog.isStarting ? <p role="status">Iniciando cámara…</p> : null}
          {dialog.warningMessage ? <p className={styles.warning}>{dialog.warningMessage} Podés usar esta foto o volver a sacarla.</p> : null}
          {dialog.error ? <p role="alert" className={styles.error}>{dialog.error}</p> : null}
        </div>
        <div className={styles.help}>
          <p>Si no podés usar la cámara, revisá los permisos, probá un navegador compatible u otro celular.</p>
          <GenericButton variant="secondary" onClick={dialog.handleContactAdvisor}>Hablar con un asesor</GenericButton>
        </div>
      </div>
    </div>
  );
}
