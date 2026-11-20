import { FaRegIdCard } from "react-icons/fa";
import { FiCamera, FiEye, FiHelpCircle, FiMaximize, FiRefreshCw, FiSmartphone, FiSun } from "react-icons/fi";
import { QRCodeSVG } from "qrcode.react";
import GenericForm from "../Forms/GenericForm/GenericForm.jsx";
import GenericButton from "../buttons/GenericButton/GenericButton.jsx";
import styles from "./DniCapture.module.css";

export default function DniCapture({ viewModel }) {
  const showMobileCapture = viewModel.isPhone && !viewModel.received;

  return (
    <GenericForm title={showMobileCapture ? undefined : "Subí las fotos de tu DNI"}
      onSubmit={viewModel.handleSubmit} className={styles.form} children_className={styles.content}>
      {viewModel.received ? (
        <p role="status">Recibimos tus fotos.</p>
      ) : viewModel.isPhone ? (
        <>
          <header className={styles.intro}>
            <span className={styles.introIcon}><FaRegIdCard aria-hidden="true" /></span>
            <h3>Sacá las fotos de tu DNI</h3>
            <p>{viewModel.description}</p>
          </header>
          <ul className={styles.tips} role="list" aria-label="Consejos para sacar las fotos">
            <li>
              <FiSun aria-hidden="true" />
              <span><strong>Apoyá el DNI sobre una superficie</strong> plana y bien iluminada.</span>
            </li>
            <li>
              <FiSmartphone aria-hidden="true" />
              <span><strong>Sacá la foto desde arriba,</strong> con el celular estable.</span>
            </li>
            <li>
              <FiMaximize aria-hidden="true" />
              <span><strong>Asegurate de que se vea el DNI completo,</strong> sin reflejos y con los datos claros.</span>
            </li>
          </ul>
          <div className={styles.slots}>
            {viewModel.slots.map(slot => (
              <section key={slot.side} className={styles.slot} aria-label={slot.label}>
                <h4>{slot.label}</h4>
                {slot.previewUrl ? (
                  <div className={styles.previewScroll} data-expanded={slot.expanded}>
                    <div className={styles.previewFrame} style={slot.frameStyle}>
                      <img src={slot.previewUrl} alt={slot.label} style={slot.imageStyle} />
                    </div>
                  </div>
                ) : null}
                {slot.previewUrl ? (
                  <GenericButton variant="secondary" onClick={slot.zoom} aria-expanded={slot.expanded}
                    aria-label={`${slot.zoomLabel} del ${slot.name}`}>
                    <FiEye aria-hidden="true" />{slot.zoomLabel}
                  </GenericButton>
                ) : null}
                <GenericButton variant="secondary" onClick={slot.open} disabled={slot.disabled} aria-label={slot.actionLabel}>
                  {slot.previewUrl ? <FiRefreshCw aria-hidden="true" /> : <FiCamera aria-hidden="true" />}
                  {slot.previewUrl ? "Volver a sacar" : slot.actionLabel}
                </GenericButton>
              </section>
            ))}
          </div>
          <div>
            <GenericButton type="submit" disabled={!viewModel.canSubmit} loading={viewModel.isUploading}>Enviar fotos</GenericButton>
            <p className={styles.uploadStatus} role="status">
              {viewModel.isUploading ? "Estamos procesando tus fotos. Aguardá unos segundos." : null}
            </p>
          </div>
          {viewModel.isUploading ? <GenericButton variant="secondary" onClick={viewModel.handleCancelUpload}>Cancelar envío</GenericButton> : null}
        </>
      ) : (viewModel.isPreparingQr || viewModel.qrUrl) ? (
        <div className={styles.handoff}>
          <p>Escaneá el código con tu celular para sacar las fotos de tu DNI.</p>
          <div className={styles.qrFrame} aria-busy={viewModel.isPreparingQr}>
            {viewModel.qrUrl ? <QRCodeSVG value={viewModel.qrUrl} size={180} title="Escaneá con tu celular" /> : null}
          </div>
          <p className={styles.qrStatus} role="status">
            {viewModel.isPreparingQr ? "Preparando el código QR…" : "Esperando las fotos de tu celular…"}
          </p>
        </div>
      ) : null}
      {viewModel.isPhone && viewModel.isLoading ? <p role="status">Preparando la captura…</p> : null}
      {viewModel.continuing ? <p role="status">Recuperando el paso de tu solicitud…</p> : null}
      {viewModel.error ? <p className={styles.error} role="alert">{viewModel.error}</p> : null}
      {viewModel.continuationError ? <GenericButton onClick={viewModel.continueFlow} disabled={viewModel.continuing}>Volver a intentar continuar</GenericButton> : null}
      {viewModel.canNewOperation ? <GenericButton variant="secondary" onClick={viewModel.handleNewOperation}>Actualizar para reintentar con estas fotos</GenericButton> : null}
      {viewModel.canRefresh ? <GenericButton variant="secondary" onClick={viewModel.handleRefresh}>Actualizar captura</GenericButton> : null}
      <div className={styles.help}>
        {showMobileCapture ? (
          <p className={styles.mobileHelp}>
            <FiHelpCircle aria-hidden="true" />
            <span>¿Necesitás ayuda con la cámara? Revisá los permisos, probá un navegador compatible o usá otro celular.</span>
          </p>
        ) : (
          <p>¿Necesitás ayuda con la cámara? Revisá los permisos, probá un navegador compatible u otro celular.</p>
        )}
        <GenericButton variant="secondary" onClick={viewModel.handleContactAdvisor}>Hablar con un asesor</GenericButton>
      </div>
    </GenericForm>
  );
}
