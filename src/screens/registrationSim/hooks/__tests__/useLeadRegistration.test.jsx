// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mocks: declarados ANTES de importar el hook bajo test
vi.mock("../../../../services/leadRegistrationService.js", () => ({
  __esModule: true,
  default: {
    crearLead: vi.fn(),
  },
}));

vi.mock("../../../../lib/fingerprint.js", () => ({
  getFingerprint: vi.fn().mockResolvedValue(null),
  mapFingerprintToHuellaData: vi.fn().mockReturnValue(null),
}));

import LeadRegistrationService from "../../../../services/leadRegistrationService.js";
import { useLeadRegistration } from "../useLeadRegistration";

// Helper: arma un change event sintético para handleChange.
// El hook espera { target: { name, value } } y aplica sanitización.
const changeEvent = (name, value) => ({ target: { name, value } });

// Helper: setea DNI y situación laboral válidos, dejando al test controlar el celular.
const fillValidExtras = (result, { dni = "25000000", situacionLaboral = "RELACION_DEPENDENCIA" } = {}) => {
  act(() => {
    result.current.handleChange(changeEvent("dni", dni));
    result.current.handleChange(changeEvent("situacionLaboral", situacionLaboral));
  });
};

describe("useLeadRegistration - validación de celular", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rechaza celular con menos de 10 dígitos y NO llama a crearLead", async () => {
    LeadRegistrationService.crearLead.mockResolvedValue({ success: true, data: { token: "x" } });

    const { result } = renderHook(() => useLeadRegistration("turnstile-token"));
    fillValidExtras(result);

    // Simular ingreso de "11" (caso del bug: el form lo aceptaba).
    act(() => {
      result.current.handleChange(changeEvent("celular", "11"));
    });

    let r;
    await act(async () => {
      r = await result.current.crearLead("turnstile-token");
    });

    expect(r).toEqual({ success: false, validationFailed: true });
    expect(result.current.errors.celular).toBe("Ingresá los 10 dígitos de tu celular");
    expect(LeadRegistrationService.crearLead).not.toHaveBeenCalled();
  });

  it("rechaza celular con 9 dígitos (no 10) y NO llama a crearLead", async () => {
    LeadRegistrationService.crearLead.mockResolvedValue({ success: true, data: { token: "x" } });

    const { result } = renderHook(() => useLeadRegistration("turnstile-token"));
    fillValidExtras(result);

    act(() => {
      result.current.handleChange(changeEvent("celular", "114567890"));
    });

    let r;
    await act(async () => {
      r = await result.current.crearLead("turnstile-token");
    });

    expect(r).toEqual({ success: false, validationFailed: true });
    expect(result.current.errors.celular).toBe("Ingresá los 10 dígitos de tu celular");
    expect(LeadRegistrationService.crearLead).not.toHaveBeenCalled();
  });

  it("rechaza celular vacío y NO llama a crearLead", async () => {
    LeadRegistrationService.crearLead.mockResolvedValue({ success: true, data: { token: "x" } });

    const { result } = renderHook(() => useLeadRegistration("turnstile-token"));
    // Solo completamos DNI y situación laboral; el celular queda vacío.
    fillValidExtras(result);

    let r;
    await act(async () => {
      r = await result.current.crearLead("turnstile-token");
    });

    expect(r).toEqual({ success: false, validationFailed: true });
    expect(result.current.errors.celular).toBe("El celular es requerido");
    expect(LeadRegistrationService.crearLead).not.toHaveBeenCalled();
  });

  it("acepta exactamente 10 dígitos y procede a llamar a crearLead", async () => {
    LeadRegistrationService.crearLead.mockResolvedValue({
      success: true,
      data: { token: "x", lead: { id_scoring: 1 } },
    });

    const { result } = renderHook(() => useLeadRegistration("turnstile-token"));
    fillValidExtras(result);

    act(() => {
      result.current.handleChange(changeEvent("celular", "1145678901"));
    });

    await act(async () => {
      await result.current.crearLead("turnstile-token");
    });

    expect(LeadRegistrationService.crearLead).toHaveBeenCalledTimes(1);
    expect(result.current.errors.celular).toBe("");
    const payload = LeadRegistrationService.crearLead.mock.calls[0][0];
    expect(payload.celular).toBe("1145678901");
  });
});
