import { QRCodeSVG } from "qrcode.react";
import GenericForm from "../Forms/GenericForm/GenericForm.jsx";
import GenericButton from "../buttons/GenericButton/GenericButton.jsx";
import styles from "./DniCapture.module.css";

export default function DniCapture({ viewModel }) {
  return (
    <GenericForm title="Subí las fotos de tu DNI" description={viewModel.description}
      onSubmit={viewModel.handleSubmit} className={styles.form} children_className={styles.content}>
      {viewModel.received ? (
        <p role="status">Recibimos tus fotos. Podés volver a la PC para continuar con tu solicitud. Esto confirma la recepción de las fotos.</p>
      ) : viewModel.isPhone ? (
        <>
          <p className={styles.instructions}>Sacá el DNI de la funda. Apoyalo sobre una superficie lisa con luz pareja. Incluí las cuatro esquinas y acercate hasta que se lean los datos y códigos. Evitá reflejos y sombras sobre ellos. Revisá que esté bien enfocado. La guía no recorta la foto.</p>
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
                {slot.previewUrl ? <GenericButton variant="secondary" onClick={slot.zoom} aria-expanded={slot.expanded}>{slot.zoomLabel}</GenericButton> : null}
                <GenericButton variant="secondary" onClick={slot.open} disabled={slot.disabled}>{slot.actionLabel}</GenericButton>
              </section>
            ))}
          </div>
          <GenericButton type="submit" disabled={!viewModel.canSubmit} loading={viewModel.isUploading}>Enviar fotos</GenericButton>
          {viewModel.isUploading ? <GenericButton variant="secondary" onClick={viewModel.handleCancelUpload}>Cancelar envío</GenericButton> : null}
        </>
      ) : (
        <div className={styles.handoff}>
          <p>Escaneá el código con tu celular para sacar las fotos de tu DNI.</p>
          {viewModel.qrUrl ? <QRCodeSVG value={viewModel.qrUrl} size={180} title="Escaneá con tu celular" /> : null}
          {viewModel.isPolling ? <p role="status">Esperando las fotos de tu celular…</p> : null}
        </div>
      )}
      {viewModel.isLoading ? <p role="status">Preparando la captura…</p> : null}
      {viewModel.continuing ? <p role="status">Recuperando el paso de tu solicitud…</p> : null}
      {viewModel.error ? <p className={styles.error} role="alert">{viewModel.error}</p> : null}
      {viewModel.continuationError ? <GenericButton onClick={viewModel.continueFlow} disabled={viewModel.continuing}>Volver a intentar continuar</GenericButton> : null}
      {viewModel.canNewOperation ? <GenericButton variant="secondary" onClick={viewModel.handleNewOperation}>Actualizar para reintentar con estas fotos</GenericButton> : null}
      {viewModel.canRefresh ? <GenericButton variant="secondary" onClick={viewModel.handleRefresh}>Actualizar captura</GenericButton> : null}
      <div className={styles.help}>
        <p>¿Necesitás ayuda con la cámara? Revisá los permisos, probá un navegador compatible u otro celular.</p>
        <GenericButton variant="secondary" onClick={viewModel.handleContactAdvisor}>Hablar con un asesor</GenericButton>
      </div>
    </GenericForm>
  );
}
