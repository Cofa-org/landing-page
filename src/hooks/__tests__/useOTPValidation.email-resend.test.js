// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import LeadRegistrationService from "../../services/leadRegistrationService.js";
import { useEmailOTP } from "../../screens/registrationSim/hooks/useEmailOTP.js";
import { useOTPValidation } from "../useOTPValidation.js";

vi.mock("../../services/leadRegistrationService.js", () => ({
  default: { solicitarOTPEmail: vi.fn(), verificarOTPEmail: vi.fn() },
}));

function useEmailResend() {
  const email = useEmailOTP(() => 42);
  const validation = useOTPValidation({
    destination: "cliente@example.test",
    onValidate: email.verificarOTPEmail,
    onResend: email.reenviarOTPEmail,
  });
  return { email, validation };
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-23T12:00:00.000Z"));
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.cookie.split(";").forEach((cookie) => {
    document.cookie = `${cookie.split("=")[0].trim()}=; Max-Age=0; path=/`;
  });
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.resetAllMocks();
});

describe("email resend cooldown with real hooks", () => {
  it.each([
    [403, "EMAIL_OTP_FLOW_NOT_ALLOWED"],
    [503, "EMAIL_OTP_CONTEXT_UNAVAILABLE"],
  ])("a %s rejection leaves cooldown unpersisted and permits a manual retry", async (status, cause) => {
    const failure = Object.assign(new Error("Reenvío no disponible"), { status, cause });
    LeadRegistrationService.solicitarOTPEmail
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce({ success: true });
    const { result } = renderHook(useEmailResend);
    await act(async () => {
      await expect(result.current.validation.handleResendClick()).rejects.toBe(failure);
    });
    expect(result.current.email.error).toContain(failure.message);
    expect(result.current.email.validating).toBe(false);
    expect(result.current.validation.cooldown).toBe(0);
    expect(localStorage.getItem("otp_cooldown_expiry")).toBeNull();
    expect(LeadRegistrationService.solicitarOTPEmail).toHaveBeenCalledTimes(1);

    await act(async () => { await result.current.validation.handleResendClick(); });
    expect(result.current.email.error).toBeNull();
    expect(result.current.validation.cooldown).toBe(120);
    expect(localStorage.getItem("otp_cooldown_expiry")).toBe("1792756920000");
    expect(LeadRegistrationService.solicitarOTPEmail).toHaveBeenCalledTimes(2);
  });

  it("a successful resend persists cooldown, blocks duplicates, and expires", async () => {
    LeadRegistrationService.solicitarOTPEmail.mockResolvedValue({ success: true });
    const { result } = renderHook(useEmailResend);
    await act(async () => { await result.current.validation.handleResendClick(); });
    expect(result.current.email.validating).toBe(false);
    expect(result.current.email.error).toBeNull();
    expect(result.current.validation.cooldown).toBe(120);
    expect(localStorage.getItem("otp_cooldown_expiry")).toBe("1792756920000");
    await act(async () => { await result.current.validation.handleResendClick(); });
    expect(LeadRegistrationService.solicitarOTPEmail).toHaveBeenCalledExactlyOnceWith({ leadId: 42 });
    act(() => { vi.advanceTimersByTime(120000); });
    expect(result.current.validation.cooldown).toBe(0);
    expect(localStorage.getItem("otp_cooldown_expiry")).toBeNull();
  });
});
