// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mocks: declarados ANTES de importar el hook bajo test
vi.mock("../../../../services/leadRegistrationService.js", () => ({
  __esModule: true,
  default: {
    subirRecibo: vi.fn(),
  },
}));

import LeadRegistrationService from "../../../../services/leadRegistrationService.js";
import { NetworkError } from "../../../../lib/network-error";
import { useReciboUpload } from "../useReciboUpload";

const makeFile = (name = "recibo.jpg") =>
  new File(["(binary)"], name, { type: "image/jpeg" });

const setFileInHook = (result) => {
  act(() => {
    result.current.handleFileChange({ target: { files: [makeFile()] } });
  });
};

describe("useReciboUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("happy path: subirRecibo exitoso retorna { success: true } y limpia uploadError", async () => {
    LeadRegistrationService.subirRecibo.mockResolvedValue({
      success: true,
      data: { id: 11, estado_onboarding: "RECIBO_SUBIDO" },
    });
    const { result } = renderHook(() => useReciboUpload());
    setFileInHook(result);

    let r;
    await act(async () => {
      r = await result.current.subirRecibo(123);
    });

    expect(r.success).toBe(true);
    expect(result.current.uploadError).toBe("");
  });

  it("response.success=false guarda mensaje del server en uploadError", async () => {
    LeadRegistrationService.subirRecibo.mockResolvedValue({
      success: false,
      message: "Archivo demasiado grande",
    });
    const { result } = renderHook(() => useReciboUpload());
    setFileInHook(result);

    await act(async () => {
      await result.current.subirRecibo(123);
    });

    expect(result.current.uploadError).toContain("Archivo demasiado grande");
  });

  it("NetworkError rejected → uploadError contiene el mensaje amigable en español", async () => {
    LeadRegistrationService.subirRecibo.mockRejectedValue(
      new NetworkError(new TypeError("Failed to fetch")),
    );
    const { result } = renderHook(() => useReciboUpload());
    setFileInHook(result);

    await act(async () => {
      await result.current.subirRecibo(123);
    });

    expect(result.current.uploadError).toContain("Sin conexión");
    expect(result.current.uploadError).toContain("WiFi");
    // Mantiene el 😊 histórico del hook
    expect(result.current.uploadError).toContain("😊");
  });

  it("Error genérico (no NetworkError) preserva el message del server", async () => {
    LeadRegistrationService.subirRecibo.mockRejectedValue(
      new Error("Token inválido o expirado"),
    );
    const { result } = renderHook(() => useReciboUpload());
    setFileInHook(result);

    await act(async () => {
      await result.current.subirRecibo(123);
    });

    expect(result.current.uploadError).toContain("Token inválido o expirado");
  });

  it("leadId null retorna early con error y NO llama al service", async () => {
    const { result } = renderHook(() => useReciboUpload());
    setFileInHook(result);

    let r;
    await act(async () => {
      r = await result.current.subirRecibo(null);
    });

    expect(r.success).toBe(false);
    expect(r.error).toContain("Lead no encontrado");
    expect(LeadRegistrationService.subirRecibo).not.toHaveBeenCalled();
  });

  it("reciboFile null retorna early con 'recibo requerido' y NO llama al service", async () => {
    const { result } = renderHook(() => useReciboUpload());

    let r;
    await act(async () => {
      r = await result.current.subirRecibo(123);
    });

    expect(r.success).toBe(false);
    expect(r.error).toContain("recibo");
    expect(LeadRegistrationService.subirRecibo).not.toHaveBeenCalled();
  });
});
