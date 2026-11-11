import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../../../../services/leadRegistrationService.js", () => ({ default: { obtenerContextoDni: vi.fn(), subirDni: vi.fn(), subirDniMobile: vi.fn() } }));
import Service from "../../../../services/leadRegistrationService.js";
import { useDNIUpload } from "../useDNIUpload.js";
const context = { solicitudId: "7", captureSessionId: "11111111-1111-4111-8111-111111111111", baseRevision: "a".repeat(64) };
const take = () => ({ blob: new Blob(["synthetic"], { type: "image/png" }), width: 1200, height: 800, rotation: 0 });
beforeEach(() => {
  vi.clearAllMocks();
  Service.obtenerContextoDni.mockResolvedValue({ success: true, data: { ...context, canCapture: true, estado_onboarding: "CELULAR_VALIDADO", dniReceivedForSession: false, receivedUploadId: null, receiptKind: "none" } });
  vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:synthetic"), revokeObjectURL: vi.fn() });
});
afterEach(() => vi.unstubAllGlobals());

describe("inline wrapper", () => {
  it("requires a lead and context before accepting captures", async () => {
    const { result } = renderHook(() => useDNIUpload());
    await waitFor(() => expect(result.current.error?.cause).toBe("DNI_CAPTURE_CONTEXT_REQUIRED"));
    act(() => expect(result.current.acceptCapture("front", take())).toBe(false));
    await act(async () => expect(await result.current.subirDNI()).toEqual({ success: false }));
    expect(Service.subirDni).not.toHaveBeenCalled();
    expect(result.current.handleFileChange).toBeUndefined();
  });
  it("delegates confirmed pairs to cookie-backed service and exposes preview aliases", async () => {
    Service.subirDni.mockImplementation(async (_lead, _files, _signal, _retry, options) => ({ success: true, data: {
      ...context, uploadId: options.uploadId, dniReceivedForSession: true, estado_onboarding: "DNI_SUBIDO", documentValidation: "not_performed",
    } }));
    const { result } = renderHook(() => useDNIUpload("42"));
    await waitFor(() => expect(result.current.canCapture).toBe(true));
    const front = take();
    act(() => { result.current.acceptCapture("front", front); result.current.acceptCapture("back", take()); });
    expect(result.current.dniFront).toBe(front.blob);
    expect(result.current.previewFront).toBe("blob:synthetic");
    await act(async () => expect((await result.current.subirDNI()).success).toBe(true));
    expect(Service.subirDni).toHaveBeenCalledTimes(1);
    expect(Service.subirDniMobile).not.toHaveBeenCalled();
  });
  it("uses prop token and clears both confirmed slots through model ownership", async () => {
    const { result } = renderHook(() => useDNIUpload("42", "synthetic-prop"));
    await waitFor(() => expect(result.current.canCapture).toBe(true));
    act(() => { result.current.acceptCapture("front", take()); result.current.acceptCapture("back", take()); });
    Service.subirDniMobile.mockRejectedValue(new TypeError("raw PII"));
    await act(async () => result.current.subirDNI());
    expect(Service.subirDniMobile.mock.calls[0][2]).toBe("synthetic-prop");
    expect(result.current.uploadError).not.toContain("raw PII");
    act(() => result.current.clearFiles());
    expect(result.current.dniFront).toBeNull();
    expect(result.current.dniBack).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});
