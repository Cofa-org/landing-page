import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import Spinner from "../../../../Components/Loader/Spinner.jsx";
import { useCameraCaptureDialog } from "../../hooks/useCameraCaptureDialog.js";
import styles from "./CameraCapture.module.css";

export default function CameraCapture({ open, onCapture, onCancel, tipoFoto }) {
  const dialog = useCameraCaptureDialog({ open, tipoFoto, onConfirm: onCapture, onCancel });
  if (!open) return null;
  return (
    <div className={styles.modalOverlay}>
      <div ref={dialog.modalRef} className={styles.modal} data-phase={dialog.phase} role="dialog" aria-modal="true" aria-labelledby={dialog.titleId} tabIndex={-1}>
        <button type="button" className={styles.closeBtn} aria-label="Cerrar cámara" onClick={dialog.handleClose}>×</button>
        <h3 className={styles.title} id={dialog.titleId}>{dialog.title}</h3>
        {dialog.isOpening ? <div className={styles.opening}>
          <div role="status"><Spinner label="Abriendo cámara…" labelColor="#333" /></div>
          {dialog.showPermissionHint ? <p className={styles.permissionHint} aria-live="polite">Si el navegador te pide permiso, permití el acceso a la cámara.</p> : null}
        </div> : null}
        {dialog.showStream ? <div className={styles.captureLayout} hidden={dialog.isOpening}>
          <div className={styles.cameraStage}>
            <div className={styles.videoContainer} style={dialog.videoFrameStyle}>
              <video ref={dialog.videoRef} autoPlay playsInline muted className={styles.video} />
              {dialog.guideStyle ? <div className={styles.overlay} aria-hidden="true">
                <div className={styles.guideRect} style={dialog.guideStyle} />
              </div> : null}
            </div>
          </div>
          {!dialog.isOpening ? <GenericButton onClick={dialog.handleCapture} disabled={!dialog.canCapture}>{dialog.captureLabel}</GenericButton> : null}
        </div> : null}
        <canvas ref={dialog.canvasRef} hidden />
        {dialog.phase === "preview" ? <div className={styles.previewContainer}>
          <div className={styles.previewScroll} data-expanded={dialog.expanded}>
            <div className={styles.previewFrame} style={dialog.previewFrameStyle}>
              <img src={dialog.previewUrl} alt={dialog.previewAlt} className={styles.previewImage} style={dialog.previewImageStyle} />
            </div>
          </div>
          <div className={styles.previewActions}>
            <GenericButton variant="secondary" onClick={dialog.handleZoom} aria-expanded={dialog.expanded}>{dialog.zoomLabel}</GenericButton>
          </div>
          <p>Revisá que se vean las cuatro esquinas y que los datos y códigos se lean con claridad.</p>
          <div className={styles.previewActions}>
            <GenericButton variant="secondary" onClick={dialog.handleRetry}>Volver a sacar</GenericButton>
            <GenericButton onClick={dialog.handleConfirm}>Usar esta foto</GenericButton>
          </div>
        </div> : null}
        {dialog.warningMessage || dialog.error ? <div aria-live="polite">
          {dialog.warningMessage ? <p className={styles.warning}>{dialog.warningMessage} Podés usar esta foto o volver a sacarla.</p> : null}
          {dialog.error ? <p role="alert" className={styles.error}>{dialog.error}</p> : null}
        </div> : null}
        {dialog.showRetry ? <div className={styles.cameraRecovery}>
          <GenericButton onClick={dialog.handleStart}>Reintentar cámara</GenericButton>
          <GenericButton variant="secondary" onClick={dialog.handleContactAdvisor}>Hablar con un asesor</GenericButton>
        </div> : null}
      </div>
    </div>
  );
}
