import React, { memo } from "react";
import PropTypes from "prop-types";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import GenericForm from "../../../../Components/Forms/GenericForm/GenericForm.jsx";
import { useReciboUploadStep } from "../../hooks/useReciboUploadStep.js";
import ReciboSlotTile from "./ReciboSlotTile.jsx";
import styles from "./ReciboUploadStep.module.css";

const ReciboUploadForm = (props) => {
  const {
    visibleSlots, hydrating, isLoading, displayError, canAddReceipt,
    isAddReceiptDisabled, isContinueDisabled, limitMessage, slotsAnnouncement,
    receiptSlotsRef, handleAddReceipt, handleSubmit, addFileToSlot, clearSlot,
    handleContactAdvisor,
  } = useReciboUploadStep(props);

  return (
    <GenericForm
      title='Subí tu recibo de sueldo'
      description='Subí tu último recibo de sueldo así te podemos ofrecer el mejor préstamo para vos.'
      onSubmit={handleSubmit}
      className={styles.formTemplateContainer}
      children_className={styles.formTemplate}
    >
      <section className={styles.receiptHelp} aria-labelledby='receipt-help-title'>
        <h4 id='receipt-help-title'>Tené en cuenta</h4>
        <ul>
          <li>
            <strong>Cobro mensual: </strong>
            <span>Adjuntá el recibo de sueldo correspondiente a tu último cobro.</span>
          </li>
          <li>
            <strong>Cobro quincenal: </strong>
            <span>Adjuntá los recibos de la primera y segunda quincena del último mes completo. Cargá uno en el espacio disponible y presioná ‘Agregar otro recibo’ para adjuntar el segundo.</span>
          </li>
        </ul>
      </section>

      <div id='receipt-upload-slots' className={styles.uploadAreaWrapper} ref={receiptSlotsRef} aria-busy={hydrating}>
        {hydrating ? (
          <div data-testid='hydration-skeleton' className={styles.skeletonSlot} aria-hidden='true' />
        ) : visibleSlots.map(({ orden, slot }) => (
          <ReciboSlotTile key={orden} orden={orden} slot={slot} onAddFile={addFileToSlot} onClear={clearSlot} />
        ))}
      </div>

      <div className={styles.receiptActions}>
        {canAddReceipt ? (
          <GenericButton
            type='button'
            variant='secondary'
            className={styles.addReceiptButton}
            onClick={handleAddReceipt}
            disabled={isAddReceiptDisabled}
            aria-controls='receipt-upload-slots'
          >
            Agregar otro recibo
          </GenericButton>
        ) : null}
        <p className={styles.receiptLimit}>{limitMessage}</p>
      </div>
      <p role='status' className={styles.screenReaderOnly}>{slotsAnnouncement}</p>
      {displayError ? <p role='alert' className={styles.error}>{displayError}</p> : null}

      <GenericButton type='submit' loading={isLoading} disabled={isContinueDisabled}>Continuar</GenericButton>
      <GenericButton type='button' variant='secondary' onClick={handleContactAdvisor}>Comunicarse con un asesor</GenericButton>
    </GenericForm>
  );
};

// Reset all local file state when the lead or the authorized capacity changes.
const ReciboUploadStep = ({ leadId, maxSlots, ...props }) => (
  <React.Fragment key={leadId}>
    <ReciboUploadForm key={maxSlots} leadId={leadId} maxSlots={maxSlots} {...props} />
  </React.Fragment>
);

const receiptStepPropTypes = {
  leadId: PropTypes.number,
  maxSlots: PropTypes.number,
  onSuccess: PropTypes.func,
  onAnalysisAfterRecibo: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.string,
};
ReciboUploadForm.propTypes = receiptStepPropTypes;
ReciboUploadStep.propTypes = receiptStepPropTypes;

export default memo(ReciboUploadStep);
