import React, { memo, useEffect } from "react";
import PropTypes from "prop-types";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import GenericForm from "../../../../Components/Forms/GenericForm/GenericForm.jsx";
import { useReciboUpload } from "../../hooks/useReciboUpload.js";
import LeadRegistrationService from "../../../../services/leadRegistrationService.js";
import { ONBOARDING_STATES } from "../../../../constants/LOAN_SIM.js";
import ReciboSlotTile from "./ReciboSlotTile.jsx";
import styles from "./ReciboUploadStep.module.css";
import { openCallbellWebchat } from "../../../../utils/callbellHelpers.js";

const MAX_SLOTS = 3;

/**
 * ReciboUploadStep — pantalla multi-recibo (hasta 3).
 *
 * Cambios vs versión anterior:
 *  - Rinde hasta 3 `ReciboSlotTile` (cada uno expone su "+ Agregar Recibo N").
 *  - Al montar, si tenemos `leadId`, consulta `getRecibosPendientes` y
 *    rehidrata los slots llamando `setSlotHydrated` por cada recibo
 *    persistido en el back. Esto permite volver a esta pantalla sin
 *    perder los recibos ya subidos.
 *  - Refactored to batch upload via `uploadAll`.
 *  - Mantiene el routing post-submit: si el back transiciona al lead a
 *    `EN_ANALISIS`, navega a la pantalla de análisis; si no, flujo normal.
 */
const ReciboUploadStep = ({
  leadId,
  onSuccess,
  onAnalysisAfterRecibo,
  loading,
  error: externalError,
}) => {
  const {
    slots,
    isUploading,
    uploadError,
    isFormValid,
    addFileToSlot,
    clearSlot,
    uploadAll,
    setSlotHydrated,
  } = useReciboUpload();

  // Rehydrate from server on mount.
  useEffect(() => {
    if (!leadId) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const existentes = await LeadRegistrationService.getRecibosPendientes(leadId);
        if (cancelled) return;
        for (const r of existentes) {
          setSlotHydrated(r.orden, {
            reciboId: r.recibo_id,
            url: r.url,
            mime: r.mime,
            size: r.size,
          });
        }
      } catch (e) {
        // Rehydration es best-effort: si falla, el usuario puede volver a
        // subir. Solo logueamos para no romper la UX con un toast de error.
        console.warn("RECIBOS_REHYDRATE_FAILED:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [leadId, setSlotHydrated]);

  const isLoading = loading || isUploading;
  const displayError = uploadError || externalError;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await uploadAll(leadId);
    if (result.success) {
      const estado = result.data?.estado_onboarding;
      if (estado === ONBOARDING_STATES.EN_ANALISIS) {
        if (onAnalysisAfterRecibo) onAnalysisAfterRecibo(result.data);
      } else if (onSuccess) {
        onSuccess();
      }
    }
  };

  const visibleSlots = slots.slice(0, MAX_SLOTS);

  return (
    <GenericForm
      title='Subí tu recibo de sueldo'
      description='Necesitamos al menos un recibo para verificar tu capacidad de pago. Si cobrás por quincena o tenés varios comprobantes, podés subir hasta 3.'
      onSubmit={handleSubmit}
      className={styles.formTemplateContainer}
      children_className={styles.formTemplate}
    >
      <div className={styles.uploadAreaWrapper}>
        {visibleSlots.map((slot, idx) => (
          <ReciboSlotTile
            key={idx}
            orden={idx + 1}
            slot={slot}
            onAddFile={addFileToSlot}
            onClear={clearSlot}
            maxSlots={MAX_SLOTS}
          />
        ))}
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
        onClick={openCallbellWebchat}
      >
        Comunicarse con un asesor
      </GenericButton>
    </GenericForm>
  );
};

ReciboUploadStep.propTypes = {
  leadId: PropTypes.number,
  onSuccess: PropTypes.func,
  onAnalysisAfterRecibo: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.string,
};

export default memo(ReciboUploadStep);
