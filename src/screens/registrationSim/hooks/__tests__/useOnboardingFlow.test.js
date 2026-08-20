// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

vi.mock("../../../../services/leadRegistrationService.js", () => ({
  __esModule: true,
  default: {
    obtenerEstadoOnboarding: vi.fn().mockResolvedValue({ success: false }),
    actualizarEstadoOnboarding: vi.fn().mockResolvedValue({ success: true }),
    crearLead: vi.fn(),
  },
}));

vi.mock("../../../../lib/utils.js", () => ({
  getCookie: vi.fn().mockResolvedValue(null),
  setCookie: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../../../lib/token.js", () => ({
  getDecodedToken: vi.fn().mockReturnValue(null),
}));

import { useOnboardingFlow } from "../useOnboardingFlow.js";
import { LOAN_SIM_STEPS } from "../../../../constants/LOAN_SIM.js";
import LeadRegistrationService from "../../../../services/leadRegistrationService.js";
import { getCookie } from "../../../../lib/utils.js";
import { getDecodedToken } from "../../../../lib/token.js";

describe("useOnboardingFlow.handlePickerPick — retry branch (2nd-attempt)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retryAvailable=true + decision.estado=PHONE_PICKER → re-triggers picker with new options/target, does NOT navigate forward", async () => {
    const { result } = renderHook(() => useOnboardingFlow());

    const submitPick = vi.fn().mockResolvedValue({
      success: true,
      data: {
        estado: "PHONE_PICKER",
        decision: { estado: "PHONE_PICKER", emitirAnalisis: false, motivoRechazo: null },
        retryAvailable: true,
        nextOptions: ["11", "22", "33", "44"],
        nextTarget: "3834429551",
        attemptNumber: 2,
        attemptsLeft: 0,
      },
    });

    await act(async () => {
      await result.current.handlePickerPick(submitPick, "3834429550");
    });

    expect(result.current.pickerContext).toEqual({
      options: ["11", "22", "33", "44"],
      target: "3834429551",
      // PATCH 2026-08-20 (whole-branch review #2): pickerContext previo era
      // null, así que el form-setter preserva el default "otp". Antes del
      // fix el campo ni siquiera existía (origenTrigger solo se setea desde
      // scoring-sync); ahora forma parte del contrato de handlePickerTriggered.
      origenTrigger: "otp",
    });
    expect(result.current.onboardingStep).toBe(LOAN_SIM_STEPS.PHONE_PICKER);
    expect(result.current.onboardingStep).not.toBe(LOAN_SIM_STEPS.DNI_UPLOAD);
    expect(result.current.onboardingStep).not.toBe(LOAN_SIM_STEPS.RECIBO_UPLOAD);
    expect(result.current.onboardingStep).not.toBe(LOAN_SIM_STEPS.RECHAZADO);
  });

  it("decision.estado=RECHAZADO → calls handleRejected, does NOT re-trigger picker", async () => {
    const { result } = renderHook(() => useOnboardingFlow());

    const submitPick = vi.fn().mockResolvedValue({
      success: true,
      data: {
        estado: "NO_VALIDADO",
        decision: { estado: "RECHAZADO", emitirAnalisis: false, motivoRechazo: "PHONE_PICKER_FAILED" },
      },
    });

    await act(async () => {
      await result.current.handlePickerPick(submitPick, "3834429550");
    });

    expect(result.current.onboardingStep).toBe(LOAN_SIM_STEPS.RECHAZADO);
    expect(result.current.pickerContext).toBeNull();
  });

  it("success path → advances to DNI_UPLOAD (no-cliente)", async () => {
    const { result } = renderHook(() => useOnboardingFlow());

    const submitPick = vi.fn().mockResolvedValue({
      success: true,
      data: {
        estado: "VALIDADO",
        decision: { estado: "DNI_SUBIDO", emitirAnalisis: false, motivoRechazo: null },
        es_cliente: false,
      },
    });

    await act(async () => {
      await result.current.handlePickerPick(submitPick, "3834429550");
    });

    expect(result.current.onboardingStep).toBe(LOAN_SIM_STEPS.DNI_UPLOAD);
    expect(result.current.pickerContext).toBeNull();
  });

  // whole-branch review finding #2: scoring-sync picker reaches a retry
  // (attempt 2). `handlePickerTriggered` re-crea el contexto con solo
  // {options, target} y sobreescribe `origenTrigger`. Sin preservarlo, el
  // segundo pick cae al path OTP normal (DNI_UPLOAD/RECIBO_UPLOAD) en vez
  // de respetar el contrato scoring-sync (EN_ANALISIS | WELCOME directo).
  it("retry (handlePickerTriggered) preserva origenTrigger previo (scoring-sync)", async () => {
    const { result } = renderHook(() => useOnboardingFlow());

    // Contexto inicial armado por scoring-sync (origenTrigger='scoring').
    await act(async () => {
      result.current.setPickerContext({
        options: ["111", "222", "333", "444"],
        target: "3834429550",
        origenTrigger: "scoring",
      });
    });

    // El retry invoca handlePickerTriggered con nuevas opciones/target.
    await act(async () => {
      result.current.handlePickerTriggered({
        options: ["55", "66", "77", "88"],
        target: "3834429551",
      });
    });

    // origenTrigger debe sobrevivir al re-trigger del retry.
    expect(result.current.pickerContext).toEqual({
      options: ["55", "66", "77", "88"],
      target: "3834429551",
      origenTrigger: "scoring",
    });
    expect(result.current.pickerContext.origenTrigger).toBe("scoring");
    expect(result.current.onboardingStep).toBe(LOAN_SIM_STEPS.PHONE_PICKER);
  });
});

describe("useOnboardingFlow.handlePickerPick — scoring-sync navigation (plan 2026-08-20)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("origenTrigger='scoring' + emitirAnalisis=true → navega a EN_ANALISIS (no al flujo DNI/Recibo)", async () => {
    const { result } = renderHook(() => useOnboardingFlow());

    await act(async () => {
      result.current.setPickerContext({
        options: ["111", "222", "333", "444"],
        target: "3834429550",
        origenTrigger: "scoring",
      });
    });

    const submitPick = vi.fn().mockResolvedValue({
      success: true,
      data: {
        estado: "VALIDADO",
        decision: {
          estado: "DNI_SUBIDO",
          emitirAnalisis: true,
          motivoRechazo: null,
        },
        es_cliente: false,
      },
    });

    await act(async () => {
      await result.current.handlePickerPick(submitPick, "3834429550");
    });

    expect(result.current.onboardingStep).toBe(LOAN_SIM_STEPS.EN_ANALISIS);
    expect(result.current.pickerContext).toBeNull();
    expect(result.current.onboardingStep).not.toBe(LOAN_SIM_STEPS.DNI_UPLOAD);
    expect(result.current.onboardingStep).not.toBe(LOAN_SIM_STEPS.RECIBO_UPLOAD);
  });

  it("origenTrigger='scoring' + emitirAnalisis=false → navega a WELCOME", async () => {
    const { result } = renderHook(() => useOnboardingFlow());

    await act(async () => {
      result.current.setPickerContext({
        options: ["111", "222", "333", "444"],
        target: "3834429550",
        origenTrigger: "scoring",
      });
    });

    const submitPick = vi.fn().mockResolvedValue({
      success: true,
      data: {
        estado: "VALIDADO",
        decision: {
          estado: "DNI_SUBIDO",
          emitirAnalisis: false,
          motivoRechazo: null,
        },
        es_cliente: false,
      },
    });

    await act(async () => {
      await result.current.handlePickerPick(submitPick, "3834429550");
    });

    expect(result.current.onboardingStep).toBe(LOAN_SIM_STEPS.WELCOME);
    expect(result.current.pickerContext).toBeNull();
    expect(result.current.onboardingStep).not.toBe(LOAN_SIM_STEPS.EN_ANALISIS);
    expect(result.current.onboardingStep).not.toBe(LOAN_SIM_STEPS.DNI_UPLOAD);
    expect(result.current.onboardingStep).not.toBe(LOAN_SIM_STEPS.RECIBO_UPLOAD);
  });

  it("origenTrigger='otp' (default) → navega a DNI_UPLOAD (regresión OTP normal)", async () => {
    const { result } = renderHook(() => useOnboardingFlow());

    await act(async () => {
      result.current.setPickerContext({
        options: ["111", "222", "333", "444"],
        target: "3834429550",
        origenTrigger: "otp",
      });
    });

    const submitPick = vi.fn().mockResolvedValue({
      success: true,
      data: {
        estado: "VALIDADO",
        decision: {
          estado: "DNI_SUBIDO",
          emitirAnalisis: false,
          motivoRechazo: null,
        },
        es_cliente: false,
      },
    });

    await act(async () => {
      await result.current.handlePickerPick(submitPick, "3834429550");
    });

    expect(result.current.onboardingStep).toBe(LOAN_SIM_STEPS.DNI_UPLOAD);
    expect(result.current.pickerContext).toBeNull();
    expect(result.current.onboardingStep).not.toBe(LOAN_SIM_STEPS.WELCOME);
    expect(result.current.onboardingStep).not.toBe(LOAN_SIM_STEPS.EN_ANALISIS);
  });
});

describe("useOnboardingFlow.restoreOnboardingState — pickerContext restore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lead en PHONE_PICKER con pickerContext en la respuesta → setPickerContext se invoca con el contexto", async () => {
    const pickerContext = {
      options: ["111", "222", "333", "444"],
      target: "3834429550",
      attemptNumber: 1,
      attemptsTotal: 2,
      retryAvailable: true,
    };

    getCookie.mockResolvedValue("fake-token");
    getDecodedToken.mockReturnValue({ leadId: 1 });
    LeadRegistrationService.obtenerEstadoOnboarding.mockResolvedValue({
      success: true,
      data: {
        estado_onboarding: "PHONE_PICKER",
        pickerContext,
      },
    });

    const { result } = renderHook(() => useOnboardingFlow());

    await waitFor(() => {
      expect(result.current.onboardingStep).toBe(LOAN_SIM_STEPS.PHONE_PICKER);
    });
    expect(result.current.pickerContext).toEqual(pickerContext);
  });

  it("lead en PHONE_PICKER con pickerContext=null → onboardingStep es PHONE_PICKER pero el contexto queda null", async () => {
    getCookie.mockResolvedValue("fake-token");
    getDecodedToken.mockReturnValue({ leadId: 1 });
    LeadRegistrationService.obtenerEstadoOnboarding.mockResolvedValue({
      success: true,
      data: {
        estado_onboarding: "PHONE_PICKER",
        pickerContext: null,
      },
    });

    const { result } = renderHook(() => useOnboardingFlow());

    await waitFor(() => {
      expect(result.current.onboardingStep).toBe(LOAN_SIM_STEPS.PHONE_PICKER);
    });
    expect(result.current.pickerContext).toBeNull();
  });

  it("lead en PHONE_PICKER sin la propiedad pickerContext (back legacy) → onboardingStep es PHONE_PICKER y el contexto queda null", async () => {
    getCookie.mockResolvedValue("fake-token");
    getDecodedToken.mockReturnValue({ leadId: 1 });
    LeadRegistrationService.obtenerEstadoOnboarding.mockResolvedValue({
      success: true,
      data: {
        estado_onboarding: "PHONE_PICKER",
      },
    });

    const { result } = renderHook(() => useOnboardingFlow());

    await waitFor(() => {
      expect(result.current.onboardingStep).toBe(LOAN_SIM_STEPS.PHONE_PICKER);
    });
    expect(result.current.pickerContext).toBeNull();
  });
});
