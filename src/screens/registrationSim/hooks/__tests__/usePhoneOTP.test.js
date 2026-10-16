// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("../../../../lib/fingerprint.js", () => ({
  getFingerprint: vi.fn().mockResolvedValue(null),
  mapFingerprintToHuellaData: vi.fn().mockReturnValue(null),
}));

vi.mock("../../../../services/leadRegistrationService.js", () => ({
  __esModule: true,
  default: {
    solicitarOTPCelular: vi.fn(),
    verificarOTPCelular: vi.fn(),
  },
}));

import LeadRegistrationService from "../../../../services/leadRegistrationService.js";
import { usePhoneOTP } from "../usePhoneOTP.js";

describe("usePhoneOTP - reenviarOTP", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("happy path: llama a solicitarOTPCelular con leadId y celular", async () => {
    LeadRegistrationService.solicitarOTPCelular.mockResolvedValue({ success: true });
    const getLeadId = vi.fn(() => 42);
    const { result } = renderHook(() => usePhoneOTP(getLeadId));

    await act(async () => {
      await result.current.reenviarOTP("1145678901");
    });

    expect(LeadRegistrationService.solicitarOTPCelular).toHaveBeenCalledWith({
      leadId: 42,
      celular: "1145678901",
    });
    expect(result.current.error).toBeNull();
    expect(result.current.validating).toBe(false);
  });

  it("destino ausente (bug del timer sin reenvío): setea error y throws para que el caller NO dispare el cooldown", async () => {
    // Patch 2026-08-31 (OTP resend fix): `destination` undefined provenía
    // de `leadData.celular` no hidratado. Antes `reenviarOTP` retornaba
    // silenciosamente → `handleResendClick` seteaba el cooldown de 120s sin
    // disparar la API. Defense-in-depth: el hook debe propagar el problema.
    const getLeadId = vi.fn(() => 42);
    const { result } = renderHook(() => usePhoneOTP(getLeadId));

    let thrown;
    await act(async () => {
      try {
        await result.current.reenviarOTP(undefined);
      } catch (e) {
        thrown = e;
      }
    });

    expect(thrown).toBeInstanceOf(Error);
    expect(thrown.message).toMatch(/celular|destination/i);
    expect(LeadRegistrationService.solicitarOTPCelular).not.toHaveBeenCalled();
    expect(result.current.error).not.toBeNull();
    expect(result.current.validating).toBe(false);
  });

  it("leadId ausente (sesión inválida): setea error y throws", async () => {
    const getLeadId = vi.fn(() => null);
    const { result } = renderHook(() => usePhoneOTP(getLeadId));

    let thrown;
    await act(async () => {
      try {
        await result.current.reenviarOTP("1145678901");
      } catch (e) {
        thrown = e;
      }
    });

    expect(thrown).toBeInstanceOf(Error);
    expect(LeadRegistrationService.solicitarOTPCelular).not.toHaveBeenCalled();
    expect(result.current.error).not.toBeNull();
  });

  it("servicio tira error: surface message y throw", async () => {
    LeadRegistrationService.solicitarOTPCelular.mockRejectedValue(new Error("Network fail"));
    const getLeadId = vi.fn(() => 42);
    const { result } = renderHook(() => usePhoneOTP(getLeadId));

    let thrown;
    await act(async () => {
      try {
        await result.current.reenviarOTP("1145678901");
      } catch (e) {
        thrown = e;
      }
    });

    expect(thrown.message).toMatch(/Network fail/);
    expect(result.current.error).toMatch(/Network fail/);
    expect(result.current.validating).toBe(false);
  });
});

describe("usePhoneOTP - verificarOTP", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("happy path: éxito → devuelve el resultado del back sin setear error", async () => {
    LeadRegistrationService.verificarOTPCelular.mockResolvedValue({
      success: true,
      data: { estado_onboarding: "CELULAR_VALIDADO", es_cliente: true },
    });
    const getLeadId = vi.fn(() => 42);
    const { result } = renderHook(() => usePhoneOTP(getLeadId));

    let returned;
    await act(async () => {
      returned = await result.current.verificarOTP("123456");
    });

    expect(LeadRegistrationService.verificarOTPCelular).toHaveBeenCalledWith({
      leadId: 42,
      codigo: "123456",
      huella_dispositivo: null,
      requestId: null,
    });
    expect(returned).toMatchObject({ success: true });
    expect(result.current.error).toBeNull();
    expect(result.current.validating).toBe(false);
  });

  it("Plan 2026-10-09: requiresPhonePicker: el hook propaga el resultado (regression guard)", async () => {
    LeadRegistrationService.verificarOTPCelular.mockResolvedValue({
      requiresPhonePicker: true,
      options: ["111", "222", "333", "444"],
      target: "111",
    });
    const getLeadId = vi.fn(() => 42);
    const { result } = renderHook(() => usePhoneOTP(getLeadId));

    let returned;
    await act(async () => {
      returned = await result.current.verificarOTP("123456");
    });

    expect(returned).toMatchObject({ requiresPhonePicker: true });
    expect(result.current.error).toBeNull();
  });

  // Plan 2026-10-09: el back-end hace el upfront email check en
  // verificarOTPCelular. Si el email del cliente COFA es inválido, retorna
  // { requiresAdvisorContact: true, motivo: 'EMAIL_INVALID_FOR_OTP' } sin
  // envolverlo en { success: true }. El hook DEBE propagar este shape
  // (mismo patrón que requiresPhonePicker) para que el caller navegue al
  // step EMAIL_PENDING_ADVISOR. El bug que este test atrapa: la línea
  // `if (!result.success)` trata el shape como un error genérico y NO
  // propaga, perdiendo la señal de "ir al step advisor".
  it("Plan 2026-10-09: requiresAdvisorContact: el hook propaga el resultado (regression guard)", async () => {
    LeadRegistrationService.verificarOTPCelular.mockResolvedValue({
      requiresAdvisorContact: true,
      motivo: "EMAIL_INVALID_FOR_OTP",
    });
    const getLeadId = vi.fn(() => 42);
    const { result } = renderHook(() => usePhoneOTP(getLeadId));

    let returned;
    await act(async () => {
      returned = await result.current.verificarOTP("123456");
    });

    expect(returned).toMatchObject({ requiresAdvisorContact: true, motivo: "EMAIL_INVALID_FOR_OTP" });
    expect(result.current.error).toBeNull();
  });

  it("error genérico del back (success: false): surface message y no propaga", async () => {
    LeadRegistrationService.verificarOTPCelular.mockResolvedValue({
      success: false,
      message: "OTP inválido",
    });
    const getLeadId = vi.fn(() => 42);
    const { result } = renderHook(() => usePhoneOTP(getLeadId));

    let returned;
    await act(async () => {
      returned = await result.current.verificarOTP("123456");
    });

    expect(returned).toBeUndefined();
    expect(result.current.error).toMatch(/OTP inválido/);
  });

  it("servicio tira error: surface message genérico y no propaga", async () => {
    LeadRegistrationService.verificarOTPCelular.mockRejectedValue(new Error("Network fail"));
    const getLeadId = vi.fn(() => 42);
    const { result } = renderHook(() => usePhoneOTP(getLeadId));

    let returned;
    await act(async () => {
      returned = await result.current.verificarOTP("123456");
    });

    expect(returned).toBeUndefined();
    expect(result.current.error).toMatch(/problema/i);
  });
});