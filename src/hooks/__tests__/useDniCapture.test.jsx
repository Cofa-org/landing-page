import { StrictMode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../../services/leadRegistrationService.js", () => ({ default: { obtenerContextoDni: vi.fn(), subirDni: vi.fn(), subirDniMobile: vi.fn() } }));
import Service from "../../services/leadRegistrationService.js";
import { useDniCapture } from "../useDniCapture.js";

const context = { solicitudId: "9007199254740993", captureSessionId: "11111111-1111-4111-8111-111111111111", baseRevision: "a".repeat(64) };
const current = (patch = {}) => ({ success: true, data: { ...context, canCapture: true, estado_onboarding: "CELULAR_VALIDADO", dniReceivedForSession: false, receivedUploadId: null, receiptKind: "none", ...patch } });
const capture = (rotation = 0) => ({ blob: new Blob(["synthetic"], { type: "image/png" }), width: 1920, height: 1080, rotation });
const receipt = options => ({ success: true, data: { uploadId: options.uploadId, solicitudId: context.solicitudId, captureSessionId: context.captureSessionId, dniReceivedForSession: true, estado_onboarding: "DNI_SUBIDO", documentValidation: "not_performed" } });
const setup = async (props = {}) => {
  const hook = renderHook(p => useDniCapture(p), { initialProps: { leadId: "42", ...props } });
  await waitFor(() => expect(hook.result.current.contextStatus).not.toBe("loading"));
  return hook;
};
const acceptPair = result => act(() => { result.current.acceptCapture("front", capture()); result.current.acceptCapture("back", capture()); });
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };

beforeEach(() => {
  vi.clearAllMocks();
  Service.obtenerContextoDni.mockResolvedValue(current());
  Service.subirDni.mockImplementation(async (_lead, _files, _signal, _retry, options) => receipt(options));
  Service.subirDniMobile.mockImplementation(async (_lead, _files, _token, _signal, _retry, options) => receipt(options));
  let urlSequence = 0;
  vi.stubGlobal("URL", { createObjectURL: vi.fn(() => `blob:synthetic-${++urlSequence}`), revokeObjectURL: vi.fn() });
});
afterEach(() => vi.unstubAllGlobals());

describe("shared confirmed capture model", () => {
  it("loads context before enabling camera or QR and rejects premature captures", async () => {
    const loading = deferred(); Service.obtenerContextoDni.mockReturnValue(loading.promise);
    const { result } = renderHook(() => useDniCapture({ leadId: "42" }));
    expect(result.current.canCapture).toBe(false);
    act(() => expect(result.current.acceptCapture("front", capture())).toBe(false));
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    await act(async () => loading.resolve(current()));
    expect(result.current.canCapture).toBe(true);
    expect(result.current.context).toEqual(context);
  });
  it("submits PNG references, context and rotations, allowing no file/setter bypass", async () => {
    const { result } = await setup({ tokenOverride: "synthetic-prop" });
    acceptPair(result);
    let response;
    await act(async () => { response = await result.current.submitCaptures(); });
    expect(response.success).toBe(true);
    expect(Service.subirDniMobile.mock.calls[0]).toEqual([
      { leadId: "42" }, { dniFront: result.current.captures.front.blob, dniBack: result.current.captures.back.blob }, "synthetic-prop", expect.any(AbortSignal), null,
      { context, uploadId: expect.stringMatching(/^[a-f0-9-]{36}$/), rotationFront: 0, rotationBack: 0 },
    ]);
    expect(result.current.uploadSuccess).toBe(true);
    expect(result.current.handleFileChange).toBeUndefined();
    expect(result.current.setDniFront).toBeUndefined();
  });
  it("serializes double clicks immediately with a ref", async () => {
    const uploading = deferred(); Service.subirDni.mockReturnValue(uploading.promise);
    const { result } = await setup(); acceptPair(result);
    let first, second;
    act(() => { first = result.current.submitCaptures(); second = result.current.submitCaptures(); });
    await expect(second).resolves.toMatchObject({ success: false });
    expect(Service.subirDni).toHaveBeenCalledTimes(1);
    await act(async () => uploading.resolve(receipt(Service.subirDni.mock.calls[0][4])));
    await expect(first).resolves.toMatchObject({ success: true });
  });
  it("preserves photos and uploadId for an explicit identical network retry; recapture or rotate replaces it", async () => {
    Service.subirDni.mockRejectedValue(new TypeError("raw secret"));
    const { result } = await setup(); acceptPair(result);
    const original = result.current.captures.front;
    await act(async () => result.current.submitCaptures());
    const firstId = Service.subirDni.mock.calls[0][4].uploadId;
    expect(result.current.captures.front).toBe(original);
    expect(result.current.uploadError).not.toContain("raw secret");
    expect(Service.subirDni).toHaveBeenCalledTimes(1);
    await act(async () => result.current.submitCaptures());
    expect(Service.subirDni.mock.calls[1][4].uploadId).toBe(firstId);
    act(() => result.current.acceptCapture("front", { ...original, rotation: 90 }));
    await act(async () => result.current.submitCaptures());
    expect(Service.subirDni.mock.calls[2][4].uploadId).not.toBe(firstId);
    expect(Service.subirDni.mock.calls[2][4].rotationFront).toBe(90);
  });
  it("retains the operation ID after network failure and unchanged default context refresh", async () => {
    Service.subirDni.mockRejectedValueOnce(new TypeError("synthetic lost response"));
    const { result } = await setup(); acceptPair(result);
    const front = result.current.captures.front;
    const back = result.current.captures.back;
    await act(async () => result.current.submitCaptures());
    const originalId = Service.subirDni.mock.calls[0][4].uploadId;
    await act(async () => result.current.refreshContext());
    expect(result.current.context).toEqual(context);
    expect(result.current.captures.front).toBe(front);
    expect(result.current.captures.back).toBe(back);
    await act(async () => result.current.submitCaptures());
    expect(Service.subirDni.mock.calls[1][4].uploadId).toBe(originalId);
    expect(Service.subirDni.mock.calls[1][1].dniFront).toBe(front.blob);
    expect(Service.subirDni.mock.calls[1][1].dniBack).toBe(back.blob);
  });
  it("revokes each confirmed preview once on replace, clear and unmount", async () => {
    const { result, unmount } = await setup(); acceptPair(result);
    const firstUrl = result.current.captures.front.previewUrl;
    const backUrl = result.current.captures.back.previewUrl;
    act(() => result.current.acceptCapture("front", capture()));
    const replacementUrl = result.current.captures.front.previewUrl;
    act(() => result.current.clearCapture("back"));
    unmount();
    expect(URL.revokeObjectURL.mock.calls.flat().sort()).toEqual([firstUrl, backUrl, replacementUrl].sort());
  });
  it("cancel aborts upload, retains confirmed slots and ignores late success without an error", async () => {
    const uploading = deferred(); Service.subirDni.mockReturnValue(uploading.promise);
    const { result } = await setup(); acceptPair(result);
    let pending;
    act(() => { pending = result.current.submitCaptures(); });
    const signal = Service.subirDni.mock.calls[0][2];
    act(() => result.current.cancel());
    expect(signal.aborted).toBe(true);
    await act(async () => { uploading.resolve(receipt(Service.subirDni.mock.calls[0][4])); await pending; });
    expect(result.current.uploadSuccess).toBe(false);
    expect(result.current.captures.front).not.toBeNull();
    expect(result.current.uploadError).toBe("");
  });
  it("never writes image bytes to persistent storage", async () => {
    const setLocal = vi.spyOn(Storage.prototype, "setItem");
    const { result } = await setup(); acceptPair(result);
    await act(async () => result.current.submitCaptures());
    expect(setLocal).not.toHaveBeenCalled();
    setLocal.mockRestore();
  });
});

describe("session and recovery ordering", () => {
  it.each([{ solicitudId: "7" }, { captureSessionId: "22222222-2222-4222-8222-222222222222" }])(
    "never adopts another identity even for a received pair or refresh", async patch => {
      Service.obtenerContextoDni.mockResolvedValue(current({ ...patch, dniReceivedForSession: true, receiptKind: "current_session", receivedUploadId: "33333333-3333-4333-8333-333333333333" }));
      const { result } = await setup({ expectedContext: context });
      expect(result.current.context).toBeNull();
      expect(result.current.error.cause).toBe("DNI_CAPTURE_CONTEXT_CHANGED");
      expect(result.current.uploadSuccess).toBe(false);
      await act(async () => result.current.refreshContext());
      expect(result.current.context).toBeNull();
    });
  it.each([
    { dniReceivedForSession: true, receiptKind: "current_session", receivedUploadId: "33333333-3333-4333-8333-333333333333", estado_onboarding: "DNI_SUBIDO" },
    { dniReceivedForSession: false, receiptKind: "legacy", estado_onboarding: "RECIBO_SUBIDO", canCapture: false },
  ])("restores received progress before comparing stale QR baseRevision", async patch => {
    Service.obtenerContextoDni.mockResolvedValue(current({ ...patch, baseRevision: "b".repeat(64) }));
    const { result } = await setup({ expectedContext: context });
    expect(result.current.contextStatus).toBe("received");
    expect(result.current.uploadSuccess).toBe(true);
    expect(result.current.canCapture).toBe(false);
    expect(result.current.error).toBeNull();
    expect(Service.subirDniMobile).not.toHaveBeenCalled();
  });
  it("requires explicit refresh for revision conflict, retains captures, and never republishes", async () => {
    const { result } = await setup({ expectedContext: context }); acceptPair(result);
    const front = result.current.captures.front;
    Service.subirDni.mockRejectedValue({ cause: "DNI_CAPTURE_SUPERSEDED", status: 409 });
    await act(async () => result.current.submitCaptures());
    expect(result.current.canCapture).toBe(false);
    Service.obtenerContextoDni.mockResolvedValue(current({ baseRevision: "b".repeat(64) }));
    await act(async () => result.current.refreshContext());
    expect(result.current.captures.front).toBe(front);
    expect(result.current.context.baseRevision).toBe("b".repeat(64));
    expect(Service.subirDni).toHaveBeenCalledTimes(1);
    await act(async () => result.current.submitCaptures());
    expect(Service.subirDni.mock.calls[1][4].uploadId).not.toBe(Service.subirDni.mock.calls[0][4].uploadId);
  });
  it("explicit conflict recovery can prepare preserved photos against winner B receipt without posting or navigating through received", async () => {
    Service.subirDni.mockRejectedValueOnce({ cause: "DNI_CAPTURE_SUPERSEDED", status: 409 });
    const statuses = [];
    const { result } = renderHook(() => {
      const model = useDniCapture({ leadId: "42" });
      statuses.push(model.contextStatus);
      return model;
    });
    await waitFor(() => expect(result.current.canCapture).toBe(true));
    acceptPair(result);
    const front = result.current.captures.front;
    await act(async () => result.current.submitCaptures());
    const uploadA = Service.subirDni.mock.calls[0][4].uploadId;
    Service.obtenerContextoDni.mockResolvedValue(current({ baseRevision: "b".repeat(64), receiptKind: "current_session",
      dniReceivedForSession: true, receivedUploadId: "33333333-3333-4333-8333-333333333333", estado_onboarding: "DNI_SUBIDO" }));
    const recoveryStart = statuses.length;
    await act(async () => result.current.refreshContext({ newOperation: true }));
    expect(result.current.contextStatus).toBe("ready");
    expect(statuses.slice(recoveryStart)).not.toContain("received");
    expect(result.current.uploadSuccess).toBe(false);
    expect(result.current.captures.front).toBe(front);
    expect(Service.subirDni).toHaveBeenCalledTimes(1);
    await act(async () => result.current.submitCaptures());
    expect(Service.subirDni.mock.calls[1][4].uploadId).not.toBe(uploadA);
    expect(Service.subirDni.mock.calls[1][4].context.baseRevision).toBe("b".repeat(64));
  });
  it("default lost-response refresh restores the own receipt instead of preparing another POST", async () => {
    Service.subirDni.mockRejectedValueOnce(new TypeError("synthetic lost response"));
    const { result } = await setup(); acceptPair(result);
    await act(async () => result.current.submitCaptures());
    const uploadId = Service.subirDni.mock.calls[0][4].uploadId;
    Service.obtenerContextoDni.mockResolvedValue(current({ baseRevision: "b".repeat(64), receiptKind: "current_session",
      dniReceivedForSession: true, receivedUploadId: uploadId, estado_onboarding: "DNI_SUBIDO" }));
    await act(async () => result.current.refreshContext());
    expect(result.current.contextStatus).toBe("received");
    expect(result.current.uploadSuccess).toBe(true);
    await act(async () => result.current.submitCaptures());
    expect(Service.subirDni).toHaveBeenCalledTimes(1);
  });
  it.each([
    { captureSessionId: "22222222-2222-4222-8222-222222222222" },
    { solicitudId: "99" },
    { receiptKind: "legacy", estado_onboarding: "RECIBO_SUBIDO", canCapture: true },
    { canCapture: false, estado_onboarding: "EN_ANALISIS" },
  ])("explicit new operation refuses identity change, advanced legacy or unavailable step %j", async patch => {
    const { result } = await setup(); acceptPair(result);
    Service.subirDni.mockRejectedValueOnce({ cause: "DNI_CAPTURE_SUPERSEDED", status: 409 });
    await act(async () => result.current.submitCaptures());
    Service.obtenerContextoDni.mockResolvedValue(current({ baseRevision: "b".repeat(64), ...patch }));
    await act(async () => expect((await result.current.refreshContext({ newOperation: true })).success).toBe(false));
    expect(result.current.canCapture).toBe(false);
    expect(result.current.captures.front).not.toBeNull();
    expect(Service.subirDni).toHaveBeenCalledTimes(1);
  });
  it("explicit new operation requires an existing conflict and two preserved captures", async () => {
    const { result } = await setup(); acceptPair(result);
    await act(async () => expect((await result.current.refreshContext({ newOperation: true })).success).toBe(false));
    expect(Service.obtenerContextoDni).toHaveBeenCalledTimes(1);
    act(() => result.current.clearCapture("back"));
    Service.subirDni.mockRejectedValueOnce({ cause: "DNI_CAPTURE_SUPERSEDED", status: 409 });
    act(() => result.current.acceptCapture("back", capture()));
    await act(async () => result.current.submitCaptures());
    act(() => result.current.clearCapture("back"));
    await act(async () => expect((await result.current.refreshContext({ newOperation: true })).success).toBe(false));
    expect(Service.obtenerContextoDni).toHaveBeenCalledTimes(1);
  });
  it("checks the bound identity before receipt kind or availability during explicit inline recovery", async () => {
    const { result } = await setup(); acceptPair(result);
    Service.subirDni.mockRejectedValueOnce({ cause: "DNI_CAPTURE_SUPERSEDED", status: 409 });
    await act(async () => result.current.submitCaptures());
    Service.obtenerContextoDni.mockResolvedValue(current({ solicitudId: "99", receiptKind: "legacy", estado_onboarding: "RECIBO_SUBIDO", canCapture: false }));
    await act(async () => result.current.refreshContext({ newOperation: true }));
    expect(result.current.error.cause).toBe("DNI_CAPTURE_CONTEXT_CHANGED");
    expect(result.current.context.solicitudId).toBe(context.solicitudId);
  });
  it("blocks stale QR revision until an explicit refresh", async () => {
    Service.obtenerContextoDni.mockResolvedValue(current({ baseRevision: "b".repeat(64) }));
    const { result } = await setup({ expectedContext: context });
    expect(result.current.contextStatus).toBe("conflict");
    await act(async () => result.current.refreshContext());
    expect(result.current.contextStatus).toBe("ready");
  });
  it("does not restore a legacy receipt in new CELULAR_VALIDADO session", async () => {
    Service.obtenerContextoDni.mockResolvedValue(current({ receiptKind: "legacy" }));
    const { result } = await setup();
    expect(result.current.uploadSuccess).toBe(false);
  });
  it("never adopts a different server session on inline refresh without QR expectations", async () => {
    const { result } = await setup();
    Service.obtenerContextoDni.mockResolvedValue(current({ captureSessionId: "22222222-2222-4222-8222-222222222222" }));
    await act(async () => result.current.refreshContext());
    expect(result.current.error.cause).toBe("DNI_CAPTURE_CONTEXT_CHANGED");
    expect(result.current.context.captureSessionId).toBe(context.captureSessionId);
    expect(result.current.canCapture).toBe(false);
  });
  it("preserves confirmed photos across explicit refresh failure and unmount aborts the request", async () => {
    const { result, unmount } = await setup(); acceptPair(result);
    const confirmed = result.current.captures.front;
    Service.obtenerContextoDni.mockRejectedValueOnce(new TypeError("private"));
    await act(async () => result.current.refreshContext());
    expect(result.current.captures.front).toBe(confirmed);
    const pending = deferred(); Service.obtenerContextoDni.mockReturnValueOnce(pending.promise);
    let refresh;
    act(() => { refresh = result.current.refreshContext(); });
    const signal = Service.obtenerContextoDni.mock.calls.at(-1)[1].signal;
    unmount();
    expect(signal.aborted).toBe(true);
    await act(async () => { pending.resolve(current()); await refresh; });
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });
  it("restores recognized unavailable onboarding without enabling capture", async () => {
    Service.obtenerContextoDni.mockResolvedValue(current({ canCapture: false, estado_onboarding: "EN_ANALISIS" }));
    const { result } = await setup();
    expect(result.current.contextStatus).toBe("unavailable");
    expect(result.current.estadoOnboarding).toBe("EN_ANALISIS");
    expect(result.current.canCapture).toBe(false);
  });
  it("aborts old context and ignores its late response after lead changes", async () => {
    const old = deferred(); Service.obtenerContextoDni.mockReturnValueOnce(old.promise).mockResolvedValue(current({ solicitudId: "55" }));
    const { result, rerender } = renderHook(props => useDniCapture(props), { initialProps: { leadId: "42" } });
    const oldSignal = Service.obtenerContextoDni.mock.calls[0][1].signal;
    rerender({ leadId: "43" });
    await waitFor(() => expect(result.current.context?.solicitudId).toBe("55"));
    await act(async () => old.resolve(current()));
    expect(result.current.context.solicitudId).toBe("55");
    expect(oldSignal.aborted).toBe(true);
  });
  it("survives StrictMode context replay and cleans up owned URLs", async () => {
    const { result, unmount } = renderHook(() => useDniCapture({ leadId: "42" }), { wrapper: StrictMode });
    await waitFor(() => expect(result.current.canCapture).toBe(true));
    acceptPair(result);
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
    expect(Service.obtenerContextoDni.mock.calls[0][1].signal.aborted).toBe(true);
  });
});
