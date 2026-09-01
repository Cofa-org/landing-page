import React, { memo, useEffect, useState } from "react";
import PropTypes from "prop-types";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import GenericForm from "../../../../Components/Forms/GenericForm/GenericForm.jsx";
import { useReciboUpload } from "../../hooks/useReciboUpload.js";
import LeadRegistrationService from "../../../../services/leadRegistrationService.js";
import { ONBOARDING_STATES } from "../../../../constants/LOAN_SIM.js";
import ReciboSlotTile from "./ReciboSlotTile.jsx";
import styles from "./ReciboUploadStep.module.css";

const MAX_SLOTS = 3;

/**
 * Extrae el filename original del `storage_path` de un recibo persistido.
 * Shape esperado: `lead-123/PENDIENTE/RECIBO/recibo.jpg` → `"recibo.jpg"`.
 * Si `storage_path` es null/undefined/vacío, retorna `null` para que el slot
 * se hidrate igual pero sin nombre visible (backward compat con filas legacy).
 */
const extractFilenameFromStoragePath = (storagePath) => {
  if (!storagePath || typeof storagePath !== "string") return null;
  const segments = storagePath.split("/").filter(Boolean);
  return segments.length > 0 ? segments[segments.length - 1] : null;
};

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

  // `hydrating` cubre la ventana de RTT de `getRecibosPendientes` para
  // evitar el flash de 3 slots vacíos antes de que el back responda
  // (Task 6). Initializa desde `Boolean(leadId)` para que el primer paint
  // refleje inmediatamente el caso "sin RTT" cuando no hay leadId: muestra
  // los 3 placeholders, no skeletons. Cuando `leadId` existe, el default
  // `true` hace que el primer paint muestre skeletons mientras llega
  // `getRecibosPendientes`; el effect de rehydration baja `hydrating` a
  // `false` en su `finally`.
  // (I2 — whole-branch review 2026-08-31)
  const [hydrating, setHydrating] = useState(Boolean(leadId));

  // Rehydrate from server on mount.
  useEffect(() => {
    if (!leadId) {
      setHydrating(false);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const existentes = await LeadRegistrationService.getRecibosPendientes(leadId);
        console.log("RECIBOS_REHYDRATE", existentes);
        if (cancelled) return;
        for (const r of existentes) {
          setSlotHydrated(r.orden, {
            reciboId: r.recibo_id,
            url: r.url,
            mime: r.mime,
            size: r.size,
            filename: extractFilenameFromStoragePath(r.storage_path),
          });
        }
      } catch (e) {
        // Rehydration es best-effort: si falla, el usuario puede volver a
        // subir. Solo logueamos para no romper la UX con un toast de error.
        console.warn("RECIBOS_REHYDRATE_FAILED:", e);
      } finally {
        if (!cancelled) setHydrating(false);
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
console.log(slots)
  const visibleSlots = slots.slice(0, MAX_SLOTS);
console.log(visibleSlots)
  return (
    <GenericForm
      title='Subí tu recibo de sueldo'
      description='Necesitamos al menos un recibo para verificar tu capacidad de pago. Si cobrás por quincena o tenés varios comprobantes, podés subir hasta 3.'
      onSubmit={handleSubmit}
      className={styles.formTemplateContainer}
      children_className={styles.formTemplate}
    >
      <div className={styles.uploadAreaWrapper}>
        {hydrating
          ? Array.from({ length: MAX_SLOTS }, (_, idx) => (
              <div
                key={idx}
                data-testid='hydration-skeleton'
                className={styles.skeletonSlot}
                aria-hidden='true'
              />
            ))
          : visibleSlots.map((slot, idx) => (
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
  onAnalysisAfterRecibo: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.string,
};

export default memo(ReciboUploadStep);
