import { useCallback, useEffect, useRef, useState } from "react";
import LeadRegistrationService from "../services/leadRegistrationService.js";
import { assertDniCapture, dniError, isDniAbort, normalizeDniError, normalizeDniId, validDniContext, validDniUuid } from "../lib/dni-capture.js";

const LEGACY_RECEIVED_STATES = new Set(["DNI_SUBIDO", "RECIBO_SUBIDO", "ONBOARDING_COMPLETO", "EN_ANALISIS", "REALIZADO"]);
const KNOWN_STATES = new Set([...LEGACY_RECEIVED_STATES, "LEAD_CREADO", "CELULAR_VALIDADO", "RECHAZADO", "PHONE_PICKER", "EMAIL_PENDING_ADVISOR"]);
const CONFLICTS = new Set(["DNI_CAPTURE_CONTEXT_REQUIRED", "DNI_CAPTURE_CONTEXT_CHANGED", "DNI_CAPTURE_SUPERSEDED"]);
const emptyModel = () => ({ context: null, contextStatus: "idle", captures: { front: null, back: null }, error: null,
  isUploading: false, uploadSuccess: false, estadoOnboarding: null, receiptKind: "none" });

function readContext(response, expected, allowNewRevision, newOperation) {
  if (response?.success === false) throw normalizeDniError(response);
  const record = response?.data;
  if (!validDniContext(record) || !KNOWN_STATES.has(record.estado_onboarding)
    || typeof record.canCapture !== "boolean" || typeof record.dniReceivedForSession !== "boolean"
    || !["none", "legacy", "current_session"].includes(record.receiptKind)) throw dniError("DNI_TECHNICAL_ERROR");
  if (expected && (expected.solicitudId !== record.solicitudId || expected.captureSessionId !== record.captureSessionId)) {
    throw dniError("DNI_CAPTURE_CONTEXT_CHANGED");
  }
  const legacyReceived = record.receiptKind === "legacy" && LEGACY_RECEIVED_STATES.has(record.estado_onboarding);
  if (newOperation && (!record.canCapture || legacyReceived)) throw dniError("DNI_CAPTURE_STEP_UNAVAILABLE");
  const received = !newOperation && ((record.dniReceivedForSession && record.receiptKind === "current_session" && validDniUuid(record.receivedUploadId))
    || legacyReceived);
  // A successful own COMMIT changes the base revision. Restore its receipt first.
  if (!received && expected && !allowNewRevision && expected.baseRevision !== record.baseRevision) throw dniError("DNI_CAPTURE_CONTEXT_CHANGED");
  return {
    context: { solicitudId: record.solicitudId, captureSessionId: record.captureSessionId, baseRevision: record.baseRevision },
    contextStatus: received ? "received" : record.canCapture ? "ready" : "unavailable",
    uploadSuccess: Boolean(received), estadoOnboarding: record.estado_onboarding, receiptKind: record.receiptKind,
  };
}

function validReceipt(response, options) {
  const receipt = response?.data;
  return response?.success === true && receipt?.uploadId === options.uploadId
    && receipt.solicitudId === options.context.solicitudId && receipt.captureSessionId === options.context.captureSessionId
    && receipt.dniReceivedForSession === true && receipt.documentValidation === "not_performed"
    && KNOWN_STATES.has(receipt.estado_onboarding);
}

export function useDniCapture({ leadId, tokenOverride, expectedContext } = {}) {
  const [model, setModel] = useState(emptyModel);
  const modelRef = useRef(model);
  const lifecycle = useRef({ mounted: false, generation: 0, contextRequest: null, uploadRequest: null, uploadId: null, recoverableConflict: false });
  const normalizedLeadId = normalizeDniId(leadId);
  const hasExpected = expectedContext != null;
  const expectedSolicitud = expectedContext?.solicitudId;
  const expectedSession = expectedContext?.captureSessionId;
  const expectedRevision = expectedContext?.baseRevision;

  const update = useCallback(patch => {
    modelRef.current = { ...modelRef.current, ...patch };
    if (lifecycle.current.mounted) setModel(modelRef.current);
  }, []);

  const invalidate = useCallback(() => {
    const life = lifecycle.current;
    life.generation += 1;
    life.contextRequest?.abort();
    life.uploadRequest?.abort();
    life.contextRequest = null;
    life.uploadRequest = null;
  }, []);

  const loadContext = useCallback(async (allowNewRevision = false, newOperation = false) => {
    const snapshot = modelRef.current;
    if (newOperation && (!lifecycle.current.recoverableConflict || !snapshot.context || !snapshot.captures.front || !snapshot.captures.back)) {
      return { success: false, error: dniError("DNI_CAPTURE_CONTEXT_REQUIRED") };
    }
    invalidate();
    const life = lifecycle.current;
    const generation = life.generation;
    const controller = new AbortController();
    life.contextRequest = controller;
    update({ contextStatus: "loading", error: null, isUploading: false, uploadSuccess: false });
    try {
      const expected = hasExpected ? { solicitudId: expectedSolicitud, captureSessionId: expectedSession, baseRevision: expectedRevision } : null;
      if (!normalizedLeadId || (expected && !validDniContext(expected))) throw dniError("DNI_CAPTURE_CONTEXT_REQUIRED");
      const response = await LeadRegistrationService.obtenerContextoDni(normalizedLeadId, { tokenOverride, signal: controller.signal });
      if (!life.mounted || generation !== life.generation || controller.signal.aborted) return { success: false, cancelled: true };
      // Bind inline refreshes too; identity is checked before any receipt restore.
      const resolved = readContext(response, expected ?? modelRef.current.context, allowNewRevision, newOperation);
      if (newOperation || snapshot.context?.baseRevision !== resolved.context.baseRevision) life.uploadId = null;
      life.recoverableConflict = false;
      update({ ...resolved, error: null });
      return { success: true, ...resolved };
    } catch (error) {
      if (!life.mounted || generation !== life.generation || controller.signal.aborted || isDniAbort(error)) return { success: false, cancelled: true };
      const safeError = normalizeDniError(error);
      if (safeError.cause === "DNI_CAPTURE_CONTEXT_CHANGED" && modelRef.current.context) life.recoverableConflict = true;
      update({ error: safeError, contextStatus: CONFLICTS.has(safeError.cause) ? "conflict" : "error" });
      return { success: false, error: safeError };
    } finally {
      if (generation === life.generation) life.contextRequest = null;
    }
  }, [normalizedLeadId, tokenOverride, hasExpected, expectedSolicitud, expectedSession, expectedRevision, invalidate, update]);

  useEffect(() => {
    const life = lifecycle.current;
    life.mounted = true;
    life.uploadId = null;
    life.recoverableConflict = false;
    update(emptyModel());
    void loadContext();
    return () => {
      life.mounted = false;
      invalidate();
      for (const capture of Object.values(modelRef.current.captures)) if (capture) URL.revokeObjectURL(capture.previewUrl);
      modelRef.current = emptyModel();
    };
  }, [loadContext, invalidate, update]);

  const acceptCapture = useCallback((side, capture) => {
    if (!lifecycle.current.mounted || modelRef.current.contextStatus !== "ready" || lifecycle.current.uploadRequest) return false;
    if (side !== "front" && side !== "back") return false;
    try {
      assertDniCapture(capture);
      const confirmed = { blob: capture.blob, width: capture.width, height: capture.height, rotation: capture.rotation,
        previewUrl: URL.createObjectURL(capture.blob) };
      const previous = modelRef.current.captures[side];
      if (previous) URL.revokeObjectURL(previous.previewUrl);
      lifecycle.current.uploadId = null;
      update({ captures: { ...modelRef.current.captures, [side]: confirmed }, error: null });
      return true;
    } catch (error) {
      update({ error: normalizeDniError(error) });
      return false;
    }
  }, [update]);

  const clearCapture = useCallback(side => {
    if (!lifecycle.current.mounted || lifecycle.current.uploadRequest || (side !== "front" && side !== "back")) return;
    const previous = modelRef.current.captures[side];
    if (previous) URL.revokeObjectURL(previous.previewUrl);
    lifecycle.current.uploadId = null;
    update({ captures: { ...modelRef.current.captures, [side]: null }, error: null });
  }, [update]);

  const submitCaptures = useCallback(async () => {
    const life = lifecycle.current;
    const snapshot = modelRef.current;
    if (!life.mounted || life.uploadRequest || snapshot.contextStatus !== "ready" || !snapshot.captures.front || !snapshot.captures.back) return { success: false };
    const controller = new AbortController();
    const generation = life.generation;
    life.uploadRequest = controller;
    update({ isUploading: true, error: null });
    try {
      life.uploadId ??= crypto.randomUUID();
      const options = { context: snapshot.context, uploadId: life.uploadId,
        rotationFront: snapshot.captures.front.rotation, rotationBack: snapshot.captures.back.rotation };
      const files = { dniFront: snapshot.captures.front.blob, dniBack: snapshot.captures.back.blob };
      const response = tokenOverride == null
        ? await LeadRegistrationService.subirDni({ leadId: normalizedLeadId }, files, controller.signal, null, options)
        : await LeadRegistrationService.subirDniMobile({ leadId: normalizedLeadId }, files, tokenOverride, controller.signal, null, options);
      if (!life.mounted || generation !== life.generation || controller.signal.aborted) return { success: false, cancelled: true };
      if (response?.success === false) throw normalizeDniError(response);
      if (!validReceipt(response, options)) throw dniError("DNI_TECHNICAL_ERROR");
      update({ uploadSuccess: true, contextStatus: "received", estadoOnboarding: response.data.estado_onboarding, receiptKind: "current_session" });
      return { success: true, data: response.data };
    } catch (error) {
      if (!life.mounted || generation !== life.generation || controller.signal.aborted || isDniAbort(error)) return { success: false, cancelled: true };
      const safeError = normalizeDniError(error);
      life.recoverableConflict = ["DNI_CAPTURE_CONTEXT_CHANGED", "DNI_CAPTURE_SUPERSEDED"].includes(safeError.cause);
      update({ error: safeError, ...(CONFLICTS.has(safeError.cause) ? { contextStatus: "conflict" }
        : safeError.cause === "DNI_CAPTURE_STEP_UNAVAILABLE" ? { contextStatus: "unavailable" } : {}) });
      return { success: false, error: safeError };
    } finally {
      if (life.mounted && generation === life.generation) {
        life.uploadRequest = null;
        update({ isUploading: false });
      }
    }
  }, [normalizedLeadId, tokenOverride, update]);

  const refreshContext = useCallback(({ newOperation = false } = {}) => loadContext(true, newOperation === true), [loadContext]);
  const cancel = useCallback(() => {
    invalidate();
    update({ isUploading: false, error: null, ...(modelRef.current.contextStatus === "loading" ? { contextStatus: "idle" } : {}) });
  }, [invalidate, update]);

  return {
    ...model, canCapture: model.contextStatus === "ready", isContextLoading: model.contextStatus === "loading",
    isFormValid: model.contextStatus === "ready" && Boolean(model.captures.front && model.captures.back),
    uploadError: model.error?.message ?? "", acceptCapture, clearCapture, submitCaptures, refreshContext, cancel,
  };
}
