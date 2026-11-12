import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useDniCapture } from "./useDniCapture.js";
import { useDNIPolling } from "../screens/registrationSim/hooks/useDNIPolling.js";
import { normalizeDniId, resolveDniCaptureSurface, validDniContext } from "../lib/dni-capture.js";
import { openCallbellWebchat } from "../utils/callbellHelpers.js";

const SIDES = [{ side: "front", label: "Frente del DNI", name: "frente" }, { side: "back", label: "Dorso del DNI", name: "dorso" }];
const IMAGE_ERRORS = new Set(["DNI_FILE_TOO_LARGE", "DNI_IMAGE_LIMIT", "DNI_IMAGE_UNSUPPORTED", "DNI_IMAGE_INVALID", "DNI_IMAGE_TIMEOUT"]);

// Both entries share capture actions and receipt recovery, never document bytes in storage.
export function useDniCaptureScreen({ leadId, token, expectedContext, onSuccess, loading = false, externalError = "" }) {
  const normalizedLeadId = normalizeDniId(leadId);
  const hasExpected = expectedContext != null;
  const expectedSolicitud = expectedContext?.solicitudId;
  const expectedSession = expectedContext?.captureSessionId;
  const expectedRevision = expectedContext?.baseRevision;
  const binding = useMemo(() => ({
    leadId: normalizedLeadId, token, hasExpected, expectedSolicitud, expectedSession, expectedRevision,
  }), [normalizedLeadId, token, hasExpected, expectedSolicitud, expectedSession, expectedRevision]);
  const model = useDniCapture({ leadId, tokenOverride: token, expectedContext });
  const isPhone = resolveDniCaptureSurface({ userAgentDataMobile: navigator.userAgentData?.mobile, userAgent: navigator.userAgent }) === "phone-camera";
  const [activeCapture, setActiveCapture] = useState(null);
  const captureLifecycle = useRef({ binding, generation: 0, active: null });
  const [zoomSide, setZoomSide] = useState(null);
  const [continuationError, setContinuationError] = useState("");
  const [continuing, setContinuing] = useState(false);
  const [receiptObserved, setReceiptObserved] = useState(false);
  const continuation = useRef({ attempted: false, inFlight: false, received: false, generation: 0 });
  const { isPolling, pollingError, startPolling, stopPolling } = useDNIPolling(leadId, token, model.context);
  const { acceptCapture, submitCaptures, refreshContext, cancel } = model;

  useLayoutEffect(() => {
    const captureLife = captureLifecycle.current;
    captureLife.binding = binding;
    captureLife.generation += 1;
    captureLife.active = null;
    setActiveCapture(null);
    setZoomSide(null);
    setContinuing(false);
    const life = continuation.current;
    life.generation += 1;
    life.attempted = false;
    life.inFlight = false;
    life.received = false;
    setReceiptObserved(false);
    setContinuationError("");
    return () => {
      captureLife.generation += 1;
      captureLife.active = null;
      life.generation += 1;
    };
  }, [binding]);

  const continueFlow = useCallback(async () => {
    const life = continuation.current;
    if (!onSuccess || life.inFlight) return;
    const generation = life.generation;
    life.attempted = true;
    life.inFlight = true;
    setContinuing(true);
    setContinuationError("");
    try {
      await onSuccess();
    } catch {
      if (generation === life.generation) setContinuationError(life.received
        ? "Tus fotos se guardaron. Volvé a intentar continuar."
        : "No pudimos recuperar el paso de tu solicitud. Volvé a intentar continuar.");
    } finally {
      if (generation === life.generation) { life.inFlight = false; setContinuing(false); }
    }
  }, [onSuccess]);

  const handlePollingUpdate = useCallback(({ received }) => {
    continuation.current.received = received;
    setReceiptObserved(received);
    void continueFlow();
  }, [continueFlow]);

  useEffect(() => {
    if (model.uploadSuccess) {
      continuation.current.received = true;
      setReceiptObserved(true);
    }
    if ((model.uploadSuccess || model.contextStatus === "unavailable") && !continuation.current.attempted) void continueFlow();
  }, [model.uploadSuccess, model.contextStatus, continueFlow]);

  useEffect(() => {
    if (!isPhone && model.contextStatus === "ready") startPolling(handlePollingUpdate);
    return stopPolling;
  }, [isPhone, model.contextStatus, startPolling, stopPolling, handlePollingUpdate]);

  const handleCapture = useCallback(capture => {
    const life = captureLifecycle.current;
    if (!isPhone || !activeCapture || activeCapture.binding !== life.binding
      || activeCapture.generation !== life.generation || life.active !== activeCapture) return;
    if (acceptCapture(activeCapture.side, capture)) {
      life.generation += 1;
      life.active = null;
      setActiveCapture(null);
    }
  }, [isPhone, activeCapture, acceptCapture]);
  const handleCancelCapture = useCallback(() => {
    const life = captureLifecycle.current;
    if (!activeCapture || life.active !== activeCapture) return;
    life.generation += 1;
    life.active = null;
    setActiveCapture(null);
  }, [activeCapture]);
  const openCapture = useCallback((side, event) => {
    const life = captureLifecycle.current;
    if (!isPhone || !model.canCapture || model.isUploading || life.binding !== binding) return;
    // WebKit pointer activation does not focus buttons. Preserve the actual invoker
    // before the dialog takes focus so closing can restore it in every engine.
    event?.currentTarget?.focus?.();
    const candidate = { side, binding, generation: ++life.generation };
    life.active = candidate;
    setActiveCapture(candidate);
  }, [isPhone, model.canCapture, model.isUploading, binding]);
  const openFront = useCallback(event => openCapture("front", event), [openCapture]);
  const openBack = useCallback(event => openCapture("back", event), [openCapture]);
  const zoomFront = useCallback(() => setZoomSide(previous => previous === "front" ? null : "front"), []);
  const zoomBack = useCallback(() => setZoomSide(previous => previous === "back" ? null : "back"), []);
  const handleSubmit = useCallback(async event => {
    event.preventDefault();
    if (!isPhone || loading || continuation.current.received) return;
    await submitCaptures();
  }, [isPhone, loading, submitCaptures]);
  const handleRefresh = useCallback(async () => {
    stopPolling();
    continuation.current.attempted = false;
    await refreshContext();
  }, [refreshContext, stopPolling]);
  const handleNewOperation = useCallback(async () => {
    stopPolling();
    await refreshContext({ newOperation: true });
  }, [refreshContext, stopPolling]);
  const handleCancelUpload = useCallback(() => cancel(), [cancel]);

  const slots = SIDES.map(definition => {
    const capture = model.captures[definition.side];
    return {
      ...definition, previewUrl: capture?.previewUrl, expanded: zoomSide === definition.side,
      open: definition.side === "front" ? openFront : openBack,
      zoom: definition.side === "front" ? zoomFront : zoomBack,
      frameStyle: capture ? { aspectRatio: capture.width / capture.height } : undefined,
      disabled: !model.canCapture || model.isUploading || loading,
      actionLabel: capture ? `Volver a sacar el ${definition.name}` : `Sacar foto del ${definition.name}`,
      zoomLabel: zoomSide === definition.side ? `Reducir ${definition.name}` : `Ampliar ${definition.name}`,
    };
  });
  const received = receiptObserved || model.uploadSuccess;
  const canHandoff = !isPhone && model.contextStatus === "ready" && !pollingError && validDniContext(model.context) && leadId && token;
  const qrUrl = canHandoff ? `${window.location.origin}/subir-dni?${new URLSearchParams({
    leadId: String(leadId), token, ...model.context,
  })}` : "";
  const canNewOperation = model.contextStatus === "conflict" && ["DNI_CAPTURE_SUPERSEDED", "DNI_CAPTURE_CONTEXT_CHANGED"].includes(model.error?.cause)
    && Boolean(model.captures.front && model.captures.back);
  const activeSide = activeCapture?.binding === binding ? activeCapture.side : null;
  const errorFace = IMAGE_ERRORS.has(model.error?.cause) ? SIDES.find(definition => definition.side === model.error?.side) : null;
  const uploadError = errorFace ? `${errorFace.label}: ${model.uploadError}` : model.uploadError;
  return {
    viewModel: { isPhone, slots, qrUrl, isPolling, received, continuing,
      description: isPhone ? "Sacá una foto del frente y otra del dorso con la cámara de tu celular." : undefined,
      isLoading: model.isContextLoading, isUploading: model.isUploading,
      canSubmit: isPhone && model.isFormValid && !loading && !received,
      error: continuationError || pollingError || uploadError || externalError,
      canRefresh: Boolean(pollingError || ["error", "conflict", "unavailable", "idle"].includes(model.contextStatus)),
      canNewOperation, continuationError, handleSubmit, handleRefresh, handleNewOperation, continueFlow, handleCancelUpload,
      handleContactAdvisor: openCallbellWebchat },
    cameraProps: { open: isPhone && activeSide !== null, tipoFoto: activeSide === "back" ? "dorso" : "frente", onCapture: handleCapture, onCancel: handleCancelCapture },
  };
}
