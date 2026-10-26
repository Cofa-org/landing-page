// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import LeadRegistrationService from "../../../../services/leadRegistrationService.js";
import { useEmailOTP } from "../useEmailOTP.js";

vi.mock("../../../../services/leadRegistrationService.js", () => ({
  default: { solicitarOTPEmail: vi.fn(), verificarOTPEmail: vi.fn() },
}));

const flowFailures = [
  [403, "EMAIL_OTP_FLOW_NOT_ALLOWED", "Primero completá la validación de tu teléfono."],
  [503, "EMAIL_OTP_CONTEXT_UNAVAILABLE", "No pudimos verificar el estado de tu solicitud."],
];

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.cookie.split(";").forEach((cookie) => {
    document.cookie = `${cookie.split("=")[0].trim()}=; Max-Age=0; path=/`;
  });
  vi.useRealTimers();
  vi.resetAllMocks();
});

describe("useEmailOTP", () => {
  it.each(flowFailures)("resend surfaces %s and rejects without leaving validation active", async (status, cause, message) => {
    const failure = Object.assign(new Error(message), { status, cause });
    let rejectRequest;
    LeadRegistrationService.solicitarOTPEmail.mockImplementationOnce(
      () => new Promise((resolve, reject) => { rejectRequest = reject; }),
    );
    const { result } = renderHook(() => useEmailOTP(() => 42));
    let request;
    act(() => { request = result.current.reenviarOTPEmail(); });
    expect(result.current.validating).toBe(true);
    await act(async () => {
      const rejected = expect(request).rejects.toBe(failure);
      rejectRequest(failure);
      await rejected;
    });
    expect(result.current.error).toContain(message);
    expect(result.current.validating).toBe(false);
    expect(LeadRegistrationService.solicitarOTPEmail).toHaveBeenCalledExactlyOnceWith({ leadId: 42 });
  });

  it("successful resend clears a previous error and resets validation", async () => {
    LeadRegistrationService.solicitarOTPEmail
      .mockRejectedValueOnce(new Error("Servicio temporalmente no disponible"))
      .mockResolvedValueOnce({ success: true });
    const { result } = renderHook(() => useEmailOTP(() => 42));
    await act(async () => {
      await expect(result.current.reenviarOTPEmail()).rejects.toThrow("Servicio temporalmente");
    });
    expect(result.current.error).toContain("Servicio temporalmente");
    await act(async () => { await result.current.reenviarOTPEmail(); });
    expect(result.current.error).toBeNull();
    expect(result.current.validating).toBe(false);
  });

  it.each(flowFailures)("verification %s returns no success or terminal rejection", async (status, cause, message) => {
    const failure = Object.assign(new Error(message), { status, cause });
    let rejectRequest;
    LeadRegistrationService.verificarOTPEmail.mockImplementationOnce(
      () => new Promise((resolve, reject) => { rejectRequest = reject; }),
    );
    const { result } = renderHook(() => useEmailOTP(() => 42));
    let request;
    act(() => { request = result.current.verificarOTPEmail("123456"); });
    expect(result.current.validating).toBe(true);
    await act(async () => {
      rejectRequest(failure);
      await expect(request).resolves.toBeUndefined();
    });
    expect(result.current.error).toContain(message);
    expect(result.current.validating).toBe(false);
    expect(LeadRegistrationService.verificarOTPEmail).toHaveBeenCalledExactlyOnceWith({ leadId: 42, codigo: "123456" });
  });

  it.each(["cause", "data.cause"])("preserves the max-attempt rejection from %s", async (location) => {
    const cause = "OTP_MAX_FAIL_ATTEMPTS_EXCEEDED";
    const failure = Object.assign(new Error("Máximo de intentos superado"),
      location === "cause" ? { cause } : { data: { cause } });
    LeadRegistrationService.verificarOTPEmail.mockRejectedValueOnce(failure);
    const { result } = renderHook(() => useEmailOTP(() => 42));
    await act(async () => {
      await expect(result.current.verificarOTPEmail("123456")).rejects.toBe(failure);
    });
    expect(result.current.error).toContain(failure.message);
    expect(result.current.validating).toBe(false);
  });

  it("returns successful verification for the caller to advance", async () => {
    const response = { success: true, data: { estado_onboarding: "CELULAR_VALIDADO" } };
    LeadRegistrationService.verificarOTPEmail.mockResolvedValueOnce(response);
    const { result } = renderHook(() => useEmailOTP(() => 42));
    await act(async () => {
      await expect(result.current.verificarOTPEmail("123456")).resolves.toBe(response);
    });
    expect(result.current.error).toBeNull();
    expect(result.current.validating).toBe(false);
  });
});
