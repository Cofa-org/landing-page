import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../../../../services/leadRegistrationService.js", () => ({ default: { obtenerContextoDni: vi.fn(), subirDni: vi.fn(), subirDniMobile: vi.fn() } }));
import Service from "../../../../services/leadRegistrationService.js";
import { useDNIUploadMobile } from "../useDNIUploadMobile.js";
const context = { solicitudId: "7", captureSessionId: "11111111-1111-4111-8111-111111111111", baseRevision: "a".repeat(64) };
const take = () => ({ blob: new Blob(["synthetic"], { type: "image/png" }), width: 1200, height: 800, rotation: 270 });
beforeEach(() => {
  vi.clearAllMocks();
  Service.obtenerContextoDni.mockResolvedValue({ success: true, data: { ...context, canCapture: true, estado_onboarding: "CELULAR_VALIDADO", dniReceivedForSession: false, receivedUploadId: null, receiptKind: "none" } });
  vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:synthetic"), revokeObjectURL: vi.fn() });
});
afterEach(() => vi.unstubAllGlobals());

describe("mobile wrapper", () => {
  it("validates expected QR context and passes the explicit token to upload", async () => {
    Service.subirDniMobile.mockImplementation(async (_lead, _files, _token, _signal, _retry, options) => ({ success: true, data: {
      ...context, uploadId: options.uploadId, dniReceivedForSession: true, estado_onboarding: "DNI_SUBIDO", documentValidation: "not_performed",
    } }));
    const { result } = renderHook(() => useDNIUploadMobile("42", "synthetic-qr", context));
    await waitFor(() => expect(result.current.canCapture).toBe(true));
    act(() => { result.current.acceptCapture("front", take()); result.current.acceptCapture("back", take()); });
    await act(async () => expect((await result.current.submitDNI()).success).toBe(true));
    expect(Service.subirDniMobile.mock.calls[0][2]).toBe("synthetic-qr");
    expect(Service.subirDniMobile.mock.calls[0][5]).toMatchObject({ context, rotationFront: 270, rotationBack: 270 });
    expect(result.current.uploadSuccess).toBe(true);
    expect(result.current.setDniFront).toBeUndefined();
    expect(result.current.handleCapture).toBeUndefined();
  });
  it("rejects a missing explicit QR token without falling back to another session cookie", async () => {
    const { result } = renderHook(() => useDNIUploadMobile("42", undefined, context));
    await waitFor(() => expect(result.current.error?.cause).toBe("DNI_CAPTURE_CONTEXT_REQUIRED"));
    expect(result.current.canCapture).toBe(false);
    expect(Service.obtenerContextoDni).not.toHaveBeenCalled();
  });
  it("rejects a mismatched QR identity before camera access", async () => {
    const { result } = renderHook(() => useDNIUploadMobile("42", "synthetic-qr", { ...context, solicitudId: "8" }));
    await waitFor(() => expect(result.current.contextStatus).toBe("conflict"));
    expect(result.current.canCapture).toBe(false);
    expect(result.current.uploadSuccess).toBe(false);
  });
});
