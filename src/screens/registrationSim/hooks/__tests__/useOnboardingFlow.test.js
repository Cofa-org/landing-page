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
