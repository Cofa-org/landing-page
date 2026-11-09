import { useCallback, useEffect, useRef, useState } from "react";
import LeadRegistrationService from "../../../services/leadRegistrationService.js";
import { ONBOARDING_STATES } from "../../../constants/LOAN_SIM.js";
import { useReciboUpload } from "./useReciboUpload.js";
import { useEmailPendingAdvisor } from "./useEmailPendingAdvisor.js";

const normalizeMaxSlots = (maxSlots) =>
  Number.isInteger(maxSlots) && maxSlots >= 3 && maxSlots <= 6 ? maxSlots : 3;

const extractFilename = (storagePath) => {
  if (typeof storagePath !== "string" || !storagePath) return null;
  return storagePath.split("/").filter(Boolean).pop() ?? null;
};

const usePendingReceipts = ({ leadId, maxSlots, setSlotHydrated, revealThrough }) => {
  const hasLead = Number.isInteger(leadId) && leadId > 0;
  const [hydrating, setHydrating] = useState(hasLead);

  useEffect(() => {
    if (!hasLead) {
      setHydrating(false);
      return undefined;
    }
    const controller = new AbortController();
    let active = true;
    setHydrating(true);

    const hydrate = async () => {
      try {
        const receipts = await LeadRegistrationService.getRecibosPendientes(leadId, controller.signal);
        if (!active || controller.signal.aborted) return;
        if (!Array.isArray(receipts)) throw new TypeError("La respuesta de recibos pendientes debe ser una lista");

        let highestOrder = 1;
        for (const receipt of receipts) {
          if (!Number.isInteger(receipt?.orden) || receipt.orden < 1 || receipt.orden > maxSlots) continue;
          setSlotHydrated(receipt.orden, {
            reciboId: receipt.recibo_id,
            url: receipt.url,
            mime: receipt.mime,
            size: receipt.size,
            filename: extractFilename(receipt.storage_path),
          });
          highestOrder = Math.max(highestOrder, receipt.orden);
        }
        revealThrough(highestOrder);
      } catch (failure) {
        if (active && !controller.signal.aborted && failure?.name !== "AbortError") {
          console.warn("RECIBOS_REHYDRATE_FAILED:", failure);
        }
      } finally {
        if (active) setHydrating(false);
      }
    };
    hydrate();
    return () => {
      active = false;
      controller.abort();
    };
  }, [hasLead, leadId, maxSlots, setSlotHydrated, revealThrough]);

  return hydrating;
};

const useReceiptSubmission = ({ leadId, disabled, uploadAll, onSuccess, onAnalysisAfterRecibo }) => {
  const mountedRef = useRef(false);
  const sendingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    if (disabled || sendingRef.current || !mountedRef.current) return;
    sendingRef.current = true;
    setSubmitting(true);
    try {
      const outcome = await uploadAll(leadId);
      if (!mountedRef.current || !outcome.success) return;
      if (outcome.data?.estado_onboarding === ONBOARDING_STATES.EN_ANALISIS) {
        onAnalysisAfterRecibo?.(outcome.data);
        return;
      }
      onSuccess?.();
    } finally {
      sendingRef.current = false;
      if (mountedRef.current) setSubmitting(false);
    }
  }, [disabled, leadId, uploadAll, onSuccess, onAnalysisAfterRecibo]);

  return { submitting, handleSubmit };
};

/** Presentation state for one receipt step session, keyed by lead and capacity in the view. */
export const useReciboUploadStep = ({
  leadId,
  maxSlots: requestedMaxSlots,
  onSuccess,
  onAnalysisAfterRecibo,
  loading = false,
  error = null,
}) => {
  const maxSlots = normalizeMaxSlots(requestedMaxSlots);
  const { slots, isUploading, uploadError, addFileToSlot, clearSlot, uploadAll, setSlotHydrated } = useReciboUpload({ maxSlots });
  const [visibleCount, setVisibleCount] = useState(1);
  const receiptSlotsRef = useRef(null);
  const focusNewSlotRef = useRef(false);
  const revealThrough = useCallback((orden) => {
    setVisibleCount(previousCount => Math.max(previousCount, orden));
  }, []);
  const hydrating = usePendingReceipts({ leadId, maxSlots, setSlotHydrated, revealThrough });
  const { handleContactAdvisor } = useEmailPendingAdvisor();
  const hasReadyFile = slots.some(slot => slot?.file && slot.status === "idle");
  const hasBlockingFile = slots.some(slot => slot?.status === "compressing" || slot?.status === "error");
  const hasLead = Number.isInteger(leadId) && leadId > 0;
  const cannotSubmit = !hasLead || hydrating || loading || isUploading || !hasReadyFile || hasBlockingFile;
  const { submitting, handleSubmit } = useReceiptSubmission({
    leadId, disabled: cannotSubmit, uploadAll, onSuccess, onAnalysisAfterRecibo,
  });
  const isLoading = Boolean(loading || isUploading || submitting);
  const isAddReceiptDisabled = hydrating || isLoading;
  const canAddReceipt = visibleCount < maxSlots;

  const handleAddReceipt = useCallback(() => {
    if (isAddReceiptDisabled || !canAddReceipt) return;
    focusNewSlotRef.current = true;
    setVisibleCount(previousCount => Math.min(previousCount + 1, maxSlots));
  }, [isAddReceiptDisabled, canAddReceipt, maxSlots]);

  useEffect(() => {
    if (!focusNewSlotRef.current) return;
    focusNewSlotRef.current = false;
    receiptSlotsRef.current?.lastElementChild?.querySelector('input[type="file"]')?.focus();
  }, [visibleCount]);

  return {
    visibleSlots: slots.slice(0, visibleCount).map((slot, index) => ({ orden: index + 1, slot })),
    hydrating,
    isLoading,
    displayError: uploadError || error,
    canAddReceipt,
    isAddReceiptDisabled,
    isContinueDisabled: Boolean(cannotSubmit || submitting),
    limitMessage: `Podés adjuntar hasta ${maxSlots} recibos.`,
    slotsAnnouncement: hydrating ? "Cargando recibos." : `Mostrando ${visibleCount} de ${maxSlots} espacios para recibos.`,
    receiptSlotsRef,
    handleAddReceipt,
    handleSubmit,
    addFileToSlot,
    clearSlot,
    handleContactAdvisor,
  };
};
