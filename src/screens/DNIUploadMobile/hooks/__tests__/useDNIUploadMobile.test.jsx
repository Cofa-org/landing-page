// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("../../../../services/leadRegistrationService.js", () => ({
  __esModule: true,
  default: {
    subirDniMobile: vi.fn(),
  },
}));

import LeadRegistrationService from "../../../../services/leadRegistrationService.js";
import { NetworkError } from "../../../../lib/network-error";
import { useDNIUploadMobile } from "../useDNIUploadMobile";

const makeBlob = () => new Blob(["(binary)"], { type: "image/jpeg" });

const setBlobsInHook = (result) => {
  act(() => {
    result.current.handleCapture(makeBlob(), result.current.setDniFront, result.current.setPreviewFront);
    result.current.handleCapture(makeBlob(), result.current.setDniBack, result.current.setPreviewBack);
  });
};

describe("useDNIUploadMobile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("happy path: submitDNI exitoso retorna { success: true }", async () => {
    LeadRegistrationService.subirDniMobile.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useDNIUploadMobile(123, "tok-abc"));
    setBlobsInHook(result);

    let r;
    await act(async () => {
      r = await result.current.submitDNI();
    });

    expect(r.success).toBe(true);
    expect(result.current.uploadError).toBe("");
    expect(result.current.uploadSuccess).toBe(true);
  });

  it("response.success=false guarda mensaje del server", async () => {
    LeadRegistrationService.subirDniMobile.mockResolvedValue({
      success: false,
      message: "Mobile upload bloqueado",
    });
    const { result } = renderHook(() => useDNIUploadMobile(123, "tok-abc"));
    setBlobsInHook(result);

    await act(async () => {
      await result.current.submitDNI();
    });

    expect(result.current.uploadError).toContain("Mobile upload bloqueado");
  });

  it("NetworkError rejected → uploadError contiene el mensaje amigable en español", async () => {
    LeadRegistrationService.subirDniMobile.mockRejectedValue(
      new NetworkError(new TypeError("Failed to fetch")),
    );
    const { result } = renderHook(() => useDNIUploadMobile(123, "tok-abc"));
    setBlobsInHook(result);

    await act(async () => {
      await result.current.submitDNI();
    });

    expect(result.current.uploadError).toContain("Sin conexión");
    expect(result.current.uploadError).toContain("WiFi");
    // useDNIUploadMobile NO agrega 😊 (preserva comportamiento actual)
    expect(result.current.uploadError).not.toContain("😊");
  });

  it("Error genérico (no NetworkError) preserva el message del server", async () => {
    LeadRegistrationService.subirDniMobile.mockRejectedValue(new Error("Token inválido"));
    const { result } = renderHook(() => useDNIUploadMobile(123, "tok-abc"));
    setBlobsInHook(result);

    await act(async () => {
      await result.current.submitDNI();
    });

    expect(result.current.uploadError).toContain("Token inválido");
  });
});
