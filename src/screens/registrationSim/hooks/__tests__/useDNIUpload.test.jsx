// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("../../../../services/leadRegistrationService.js", () => ({
  __esModule: true,
  default: {
    subirDni: vi.fn(),
  },
}));

import LeadRegistrationService from "../../../../services/leadRegistrationService.js";
import { NetworkError } from "../../../../lib/network-error";
import { useDNIUpload } from "../useDNIUpload";

const makeFile = (name = "dni.jpg") =>
  new File(["(binary)"], name, { type: "image/jpeg" });

const setFilesInHook = (result) => {
  act(() => {
    result.current.handleFileChange(
      { target: { files: [makeFile("front.jpg")] } },
      result.current.setDniFront,
      result.current.setPreviewFront,
    );
    result.current.handleFileChange(
      { target: { files: [makeFile("back.jpg")] } },
      result.current.setDniBack,
      result.current.setPreviewBack,
    );
  });
};

describe("useDNIUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("happy path: subirDNI exitoso retorna { success: true }", async () => {
    LeadRegistrationService.subirDni.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useDNIUpload());
    setFilesInHook(result);

    let r;
    await act(async () => {
      r = await result.current.subirDNI(123);
    });

    expect(r.success).toBe(true);
    expect(result.current.uploadError).toBe("");
  });

  it("response.success=false guarda mensaje del server", async () => {
    LeadRegistrationService.subirDni.mockResolvedValue({
      success: false,
      message: "EXIF muy viejo",
    });
    const { result } = renderHook(() => useDNIUpload());
    setFilesInHook(result);

    await act(async () => {
      await result.current.subirDNI(123);
    });

    expect(result.current.uploadError).toContain("EXIF muy viejo");
  });

  it("NetworkError rejected → uploadError contiene el mensaje amigable en español", async () => {
    LeadRegistrationService.subirDni.mockRejectedValue(
      new NetworkError(new TypeError("Failed to fetch")),
    );
    const { result } = renderHook(() => useDNIUpload());
    setFilesInHook(result);

    await act(async () => {
      await result.current.subirDNI(123);
    });

    expect(result.current.uploadError).toContain("Sin conexión");
    expect(result.current.uploadError).toContain("WiFi");
    expect(result.current.uploadError).toContain("😊");
  });

  it("Error genérico (no NetworkError) preserva el message del server", async () => {
    LeadRegistrationService.subirDni.mockRejectedValue(new Error("Token inválido"));
    const { result } = renderHook(() => useDNIUpload());
    setFilesInHook(result);

    await act(async () => {
      await result.current.subirDNI(123);
    });

    expect(result.current.uploadError).toContain("Token inválido");
  });
});
