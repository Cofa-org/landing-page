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

describe("useOnboardingFlow manual restore recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCookie.mockResolvedValue("existing-token");
    getDecodedToken.mockReturnValue({ leadId: 42 });
    LeadRegistrationService.obtenerEstadoOnboarding.mockReset();
  });

  it("restores four picker options after OTP and clears the previous email destination", async () => {
    const pickerContext = { options: ["11", "22", "33", "44"], target: "22" };
    LeadRegistrationService.obtenerEstadoOnboarding
      .mockResolvedValueOnce({ success: true, data: { estado_onboarding: "PHONE_PICKER", emailOtpDestination: "cliente@example.com" } })
      .mockResolvedValueOnce({ success: true, data: { estado_onboarding: "PHONE_PICKER", pickerContext } });
    const { result } = renderHook(() => useOnboardingFlow());
    await waitFor(() => expect(result.current.restoringOnboarding).toBe(false));
    expect(result.current.emailOtpDestination).toBe("cliente@example.com");

    act(() => result.current.retryRestore());
    await waitFor(() => expect(result.current.restoringOnboarding).toBe(false));

    expect(result.current.onboardingStep).toBe(LOAN_SIM_STEPS.PHONE_PICKER);
    expect(result.current.pickerContext).toEqual(pickerContext);
    expect(result.current.emailOtpDestination).toBeNull();
  });

  it("restores advisor pending after OTP with precedence over both response contexts", async () => {
    LeadRegistrationService.obtenerEstadoOnboarding
      .mockResolvedValueOnce({ success: true, data: { estado_onboarding: "PHONE_PICKER", emailOtpDestination: "cliente@example.com" } })
      .mockResolvedValueOnce({ success: true, data: {
        estado_onboarding: "PHONE_PICKER",
        requiresAdvisorContact: true,
        emailOtpDestination: "otro@example.com",
        pickerContext: { options: ["11", "22", "33", "44"], target: "22" },
      } });
    const { result } = renderHook(() => useOnboardingFlow());
    await waitFor(() => expect(result.current.restoringOnboarding).toBe(false));
    expect(result.current.emailOtpDestination).toBe("cliente@example.com");

    act(() => result.current.retryRestore());
    await waitFor(() => expect(result.current.restoringOnboarding).toBe(false));

    expect(result.current.onboardingStep).toBe(LOAN_SIM_STEPS.EMAIL_PENDING_ADVISOR);
    expect(result.current.pickerContext).toBeNull();
    expect(result.current.emailOtpDestination).toBeNull();
  });

  it("exposes a restore error and retries only on request, preventing duplicate requests", async () => {
    const failure = Object.assign(new Error("ERP unavailable"), { cause: "ERP_LOOKUP_FAILED", status: 503 });
    LeadRegistrationService.obtenerEstadoOnboarding.mockRejectedValueOnce(failure);
    const { result } = renderHook(() => useOnboardingFlow());
    await waitFor(() => expect(result.current.restoringOnboarding).toBe(false));
    expect(result.current.restoreError).toBe(failure);
    expect(LeadRegistrationService.obtenerEstadoOnboarding).toHaveBeenCalledTimes(1);

    let complete;
    LeadRegistrationService.obtenerEstadoOnboarding.mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
    act(() => { result.current.retryRestore(); result.current.retryRestore(); });
    await waitFor(() => expect(LeadRegistrationService.obtenerEstadoOnboarding).toHaveBeenCalledTimes(2));
    expect(result.current.restoringOnboarding).toBe(true);
    await act(async () => { complete({ success: true, data: { estado_onboarding: "PHONE_PICKER", pickerContext: { options: ["11", "22", "33", "44"] } } }); });
    expect(result.current.restoreError).toBeNull();
    expect(result.current.onboardingStep).toBe(LOAN_SIM_STEPS.PHONE_PICKER);
    expect(result.current.leadToken).toBe("existing-token");
  });

  it("ignores a stale result after switching to resume mode", async () => {
    let complete;
    LeadRegistrationService.obtenerEstadoOnboarding.mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
    const { result, rerender } = renderHook(({ shortId }) => useOnboardingFlow(shortId), { initialProps: { shortId: null } });
    await waitFor(() => expect(LeadRegistrationService.obtenerEstadoOnboarding).toHaveBeenCalledTimes(1));
    rerender({ shortId: "resume-link" });
    act(() => result.current.setOnboardingStep(LOAN_SIM_STEPS.RECIBO_UPLOAD));
    await act(async () => { complete({ success: true, data: { estado_onboarding: "PHONE_PICKER" } }); });
    expect(result.current.onboardingStep).toBe(LOAN_SIM_STEPS.RECIBO_UPLOAD);
    expect(result.current.restoreError).toBeNull();
    expect(LeadRegistrationService.obtenerEstadoOnboarding.mock.calls[0][1].aborted).toBe(true);
  });

  it("aborts restoration on unmount", async () => {
    LeadRegistrationService.obtenerEstadoOnboarding.mockReturnValue(new Promise(() => {}));
    const { unmount } = renderHook(() => useOnboardingFlow());
    await waitFor(() => expect(LeadRegistrationService.obtenerEstadoOnboarding).toHaveBeenCalledTimes(1));
    const signal = LeadRegistrationService.obtenerEstadoOnboarding.mock.calls[0][1];
    unmount();
    expect(signal.aborted).toBe(true);
  });
});

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

// Plan 2026-09-29 (cliente email OTP): tests para la transición
// `EMAIL_OTP_VALIDATION → RECIBO_UPLOAD` post-verify. Sin esta rama, el
// usuario quedaba atascado en la pantalla de validación de email (bug
// E2E lead 30 — backend decía success pero frontend no navegaba).
describe("useOnboardingFlow — EMAIL_OTP_VALIDATION navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("navigateToNext from EMAIL_OTP_VALIDATION + esCliente=true → RECIBO_UPLOAD", async () => {
    const { result } = renderHook(() => useOnboardingFlow());

    // Forzamos el step a EMAIL_OTP_VALIDATION simulando que el picker
    // branch lo seteó.
    await act(async () => {
      result.current.setOnboardingStep(LOAN_SIM_STEPS.EMAIL_OTP_VALIDATION);
    });

    await act(async () => {
      result.current.navigateToNext(LOAN_SIM_STEPS.EMAIL_OTP_VALIDATION, {
        esCliente: true,
      });
    });

    expect(result.current.onboardingStep).toBe(LOAN_SIM_STEPS.RECIBO_UPLOAD);
  });

  it("navigateToPrev from EMAIL_OTP_VALIDATION → PHONE_PICKER (re-pick allowed)", async () => {
    const { result } = renderHook(() => useOnboardingFlow());

    // Esperar a que el useEffect de restore termine (setea restoringOnboarding
    // a false) para evitar race con el setOnboardingStep que dispara después.
    await waitFor(() => {
      expect(result.current.restoringOnboarding).toBe(false);
    });

    // Forzamos el step.
    await act(async () => {
      result.current.setOnboardingStep(LOAN_SIM_STEPS.EMAIL_OTP_VALIDATION);
    });
    await waitFor(() => {
      expect(result.current.onboardingStep).toBe(LOAN_SIM_STEPS.EMAIL_OTP_VALIDATION);
    });

    await act(async () => {
      await result.current.navigateToPrev();
    });

    expect(result.current.onboardingStep).toBe(LOAN_SIM_STEPS.PHONE_PICKER);
  });

  // Plan 2026-09-30 (email OTP validation restore): cuando el restore del
  // back reporta emailOtpDestination presente, el hook debe forzar el
  // step a EMAIL_OTP_VALIDATION (override del default PHONE_PICKER) +
  // setear emailOtpDestination state + limpiar pickerContext (es stale).
  describe("restore flow con emailOtpDestination (plan 2026-09-30)", () => {
    beforeEach(() => {
      // Default: el lead tiene un token válido → el restore effect corre.
      getCookie.mockResolvedValue("valid.jwt.token");
      getDecodedToken.mockReturnValue({ leadId: 30 });
    });

    it("response.data.emailOtpDestination presente + Solicitud PHONE_PICKER → restaura a EMAIL_OTP_VALIDATION", async () => {
      LeadRegistrationService.obtenerEstadoOnboarding = vi.fn().mockResolvedValue({
        success: true,
        data: {
          estado_onboarding: "PHONE_PICKER",
          es_cliente: true,
          celular: "1144456677",
          emailOtpDestination: "cliente@example.com",
          pickerContext: { options: ["1", "2", "3", "4"], target: "1144450000" },
        },
      });

      const { result } = renderHook(() => useOnboardingFlow());

      await waitFor(() => {
        expect(result.current.restoringOnboarding).toBe(false);
      });

      expect(result.current.onboardingStep).toBe(LOAN_SIM_STEPS.EMAIL_OTP_VALIDATION);
      expect(result.current.emailOtpDestination).toBe("cliente@example.com");
      // pickerContext debe quedar null (es stale — el usuario ya pickeó).
      expect(result.current.pickerContext).toBeNull();
    });

    it("response.data.emailOtpDestination null + Solicitud PHONE_PICKER → comportamiento previo (PHONE_PICKER + pickerContext)", async () => {
      LeadRegistrationService.obtenerEstadoOnboarding = vi.fn().mockResolvedValue({
        success: true,
        data: {
          estado_onboarding: "PHONE_PICKER",
          es_cliente: true,
          celular: "1144456677",
          emailOtpDestination: null,
          pickerContext: { options: ["1", "2", "3", "4"], target: "X" },
        },
      });

      const { result } = renderHook(() => useOnboardingFlow());

      await waitFor(() => {
        expect(result.current.restoringOnboarding).toBe(false);
      });

      expect(result.current.onboardingStep).toBe(LOAN_SIM_STEPS.PHONE_PICKER);
      expect(result.current.pickerContext).not.toBeNull();
      expect(result.current.emailOtpDestination).toBeNull();
    });

    it("response.data.emailOtpDestination presente + Solicitud CELULAR_VALIDADO → NO fuerza EMAIL_OTP_VALIDATION (estado ya pasó)", async () => {
      // Si el OTP email ya fue verificado, Solicitud está en CELULAR_VALIDADO
      // y emailOtpDestination no debe causar override (la query del back
      // retorna null para este caso, pero el test verifica el comportamiento
      // del hook si llegara a llegar emailOtpDestination con estado != PHONE_PICKER).
      LeadRegistrationService.obtenerEstadoOnboarding = vi.fn().mockResolvedValue({
        success: true,
        data: {
          estado_onboarding: "CELULAR_VALIDADO",
          es_cliente: true,
          celular: "1144456677",
          emailOtpDestination: null,
          pickerContext: null,
        },
      });

      const { result } = renderHook(() => useOnboardingFlow());

      await waitFor(() => {
        expect(result.current.restoringOnboarding).toBe(false);
      });

      expect(result.current.onboardingStep).toBe(LOAN_SIM_STEPS.DNI_UPLOAD);
    });
  });
});

// Plan 2026-10-09 (email pre-pick advisor gate): cuando el back reporta
// `requiresAdvisorContact: true`, el restore debe forzar el step a
// EMAIL_PENDING_ADVISOR (cliente COFA con email inválido en SB → debe
// contactarse con un asesor antes de llegar al picker). El override gana
// sobre `emailOtpDestination` y sobre PHONE_PICKER porque es el primer
// gate (pre-pick) del flujo. Restore override añadido después del bloque
// emailOtpDestination (precedencia por orden de checks).
describe("useOnboardingFlow.restoreOnboardingState — requiresAdvisorContact override (Plan 2026-10-09)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: el lead tiene un token válido → el restore effect corre.
    getCookie.mockResolvedValue("valid.jwt.token");
    getDecodedToken.mockReturnValue({ leadId: 30 });
  });

  it("requiresAdvisorContact=true → restaura a EMAIL_PENDING_ADVISOR", async () => {
    LeadRegistrationService.obtenerEstadoOnboarding = vi.fn().mockResolvedValue({
      success: true,
      data: {
        estado_onboarding: "PHONE_VALIDATION",
        es_cliente: true,
        celular: "1144456677",
        requiresAdvisorContact: true,
      },
    });

    const { result } = renderHook(() => useOnboardingFlow());

    await waitFor(() => {
      expect(result.current.restoringOnboarding).toBe(false);
    });

    expect(result.current.onboardingStep).toBe(LOAN_SIM_STEPS.EMAIL_PENDING_ADVISOR);
    // pickerContext debe quedar null (es stale; el usuario nunca llegó al picker).
    expect(result.current.pickerContext).toBeNull();
    // emailOtpDestination debe quedar null (override limpia el destination
    // pendiente del EMAIL_OTP_VALIDATION anterior).
    expect(result.current.emailOtpDestination).toBeNull();
  });

  it("requiresAdvisorContact=true + emailOtpDestination='cliente@example.com' → EMAIL_PENDING_ADVISOR gana (override)", async () => {
    LeadRegistrationService.obtenerEstadoOnboarding = vi.fn().mockResolvedValue({
      success: true,
      data: {
        estado_onboarding: "PHONE_PICKER",
        es_cliente: true,
        celular: "1144456677",
        // Ambas flags presentes: el override gana porque el advisor gate
        // es anterior al email OTP en el flow.
        emailOtpDestination: "cliente@example.com",
        requiresAdvisorContact: true,
        pickerContext: { options: ["1", "2", "3", "4"], target: "1144450000" },
      },
    });

    const { result } = renderHook(() => useOnboardingFlow());

    await waitFor(() => {
      expect(result.current.restoringOnboarding).toBe(false);
    });

    expect(result.current.onboardingStep).toBe(LOAN_SIM_STEPS.EMAIL_PENDING_ADVISOR);
    expect(result.current.onboardingStep).not.toBe(LOAN_SIM_STEPS.EMAIL_OTP_VALIDATION);
    expect(result.current.pickerContext).toBeNull();
    expect(result.current.emailOtpDestination).toBeNull();
  });

  it("requiresAdvisorContact=false + emailOtpDestination=null + pickerContext existe → PHONE_PICKER (regresión)", async () => {
    // Verifica que el override NO se dispara cuando la flag no está presente,
    // preservando el comportamiento previo (override es strict === true).
    LeadRegistrationService.obtenerEstadoOnboarding = vi.fn().mockResolvedValue({
      success: true,
      data: {
        estado_onboarding: "PHONE_PICKER",
        es_cliente: true,
        celular: "1144456677",
        emailOtpDestination: null,
        requiresAdvisorContact: false,
        pickerContext: { options: ["1", "2", "3", "4"], target: "1144450000" },
      },
    });

    const { result } = renderHook(() => useOnboardingFlow());

    await waitFor(() => {
      expect(result.current.restoringOnboarding).toBe(false);
    });

    expect(result.current.onboardingStep).toBe(LOAN_SIM_STEPS.PHONE_PICKER);
    expect(result.current.pickerContext).not.toBeNull();
    expect(result.current.emailOtpDestination).toBeNull();
  });

  it("requiresAdvisorContact ausente (back legacy) → comportamiento previo preservado (PHONE_VALIDATION)", async () => {
    // Si el back no incluye la propiedad, el restore debe comportarse como
    // antes del plan 2026-10-09 (strict === true: cualquier valor distinto
    // a true no dispara el override).
    LeadRegistrationService.obtenerEstadoOnboarding = vi.fn().mockResolvedValue({
      success: true,
      data: {
        estado_onboarding: "LEAD_CREADO",
        es_cliente: true,
        celular: "1144456677",
        // requiresAdvisorContact: undefined (back legacy / pre-2026-10-09)
      },
    });

    const { result } = renderHook(() => useOnboardingFlow());

    await waitFor(() => {
      expect(result.current.restoringOnboarding).toBe(false);
    });

    expect(result.current.onboardingStep).toBe(LOAN_SIM_STEPS.PHONE_VALIDATION);
    expect(result.current.onboardingStep).not.toBe(LOAN_SIM_STEPS.EMAIL_PENDING_ADVISOR);
  });
});

// Plan 2026-10-09 (email pre-pick advisor gate): back-button guard.
// EMAIL_PENDING_ADVISOR no debe estar en PREV_STEP_MAP (no back from the
// advisor step) ni en BACK_BUTTON_STEPS (no back button visible).
describe("useOnboardingFlow — EMAIL_PENDING_ADVISOR back-button guard (Plan 2026-10-09)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("navigateToPrev desde EMAIL_PENDING_ADVISOR → no navega (PREV_STEP_MAP no incluye el step)", async () => {
    const { result } = renderHook(() => useOnboardingFlow());

    await waitFor(() => {
      expect(result.current.restoringOnboarding).toBe(false);
    });

    await act(async () => {
      result.current.setOnboardingStep(LOAN_SIM_STEPS.EMAIL_PENDING_ADVISOR);
    });
    await waitFor(() => {
      expect(result.current.onboardingStep).toBe(LOAN_SIM_STEPS.EMAIL_PENDING_ADVISOR);
    });

    await act(async () => {
      await result.current.navigateToPrev();
    });

    // Step no debe cambiar (PREV_STEP_MAP[EMAIL_PENDING_ADVISOR] === undefined
    // → navigateToPrev no asigna nada).
    expect(result.current.onboardingStep).toBe(LOAN_SIM_STEPS.EMAIL_PENDING_ADVISOR);
  });

  it("shouldShowBackButton desde EMAIL_PENDING_ADVISOR → false (BACK_BUTTON_STEPS no lo incluye)", () => {
    const { result } = renderHook(() => useOnboardingFlow());

    act(() => {
      result.current.setOnboardingStep(LOAN_SIM_STEPS.EMAIL_PENDING_ADVISOR);
    });

    expect(result.current.shouldShowBackButton()).toBe(false);
  });
});


describe("useOnboardingFlow manual advisor status", () => {
  const pending = { success: true, data: { estado_onboarding: "EMAIL_PENDING_ADVISOR", requiresAdvisorContact: true } };
  const fallback = "No pudimos verificar el estado de tu solicitud. Volvé a intentarlo.";
  const status = "Tu correo todavía está pendiente de actualización. Hablá con un asesor para continuar.";

  beforeEach(() => {
    vi.clearAllMocks();
    getCookie.mockResolvedValue("advisor-token");
    getDecodedToken.mockReturnValue({ leadId: 42 });
    LeadRegistrationService.obtenerEstadoOnboarding = vi.fn().mockResolvedValueOnce(pending);
  });

  async function renderPending() {
    const hook = renderHook(() => useOnboardingFlow());
    await waitFor(() => expect(hook.result.current.restoringOnboarding).toBe(false));
    return hook;
  }

  it("keeps the pending screen during the request and sends the current lead and AbortSignal", async () => {
    let resolveRequest;
    LeadRegistrationService.obtenerEstadoOnboarding.mockImplementationOnce(() => new Promise((resolve) => { resolveRequest = resolve; }));
    const { result } = await renderPending();
    act(() => result.current.setLeadData({ leadId: 99 }));
    let request;
    act(() => { request = result.current.verificarEstadoEmailPendingAdvisor(); });
    expect(result.current.checkingEmailPendingAdvisor).toBe(true);
    expect(result.current.restoringOnboarding).toBe(false);
    expect(result.current.onboardingStep).toBe(LOAN_SIM_STEPS.EMAIL_PENDING_ADVISOR);
    expect(LeadRegistrationService.obtenerEstadoOnboarding).toHaveBeenNthCalledWith(2, 99, expect.any(AbortSignal));
    await act(async () => { resolveRequest(pending); await request; });
    expect(result.current.checkingEmailPendingAdvisor).toBe(false);
    expect(result.current.emailPendingAdvisorStatus).toBe(status);
    expect(result.current.restoreError).toBeNull();
    expect(LeadRegistrationService.obtenerEstadoOnboarding).toHaveBeenCalledTimes(2);
  });

  it.each([
    [{ estado_onboarding: "PHONE_PICKER", pickerContext: { options: ["11", "22", "33", "44"], target: "22" } }, LOAN_SIM_STEPS.PHONE_PICKER],
    [{ estado_onboarding: "PHONE_PICKER", emailOtpDestination: "cliente@example.com" }, LOAN_SIM_STEPS.EMAIL_OTP_VALIDATION],
    [{ estado_onboarding: "PHONE_PICKER", pickerContext: null, emailOtpDestination: "cliente@example.com", requiresAdvisorContact: "true" }, LOAN_SIM_STEPS.EMAIL_OTP_VALIDATION],
    [{ estado_onboarding: "PHONE_PICKER", pickerContext: null, requiresAdvisorContact: true }, LOAN_SIM_STEPS.EMAIL_PENDING_ADVISOR],
    [{ estado_onboarding: "PHONE_PICKER", pickerContext: null, emailOtpDestination: "cliente@example.com", requiresAdvisorContact: true }, LOAN_SIM_STEPS.EMAIL_PENDING_ADVISOR],
    [{ estado_onboarding: "RECHAZADO" }, LOAN_SIM_STEPS.RECHAZADO],
    [{ estado_onboarding: "PHONE_PICKER", emailOtpDestination: "cliente@example.com", requiresAdvisorContact: true }, LOAN_SIM_STEPS.EMAIL_PENDING_ADVISOR],
  ])("applies the resolved state %j", async (data, expectedStep) => {
    LeadRegistrationService.obtenerEstadoOnboarding.mockResolvedValueOnce({ success: true, data });
    const { result } = await renderPending();
    await act(async () => result.current.verificarEstadoEmailPendingAdvisor());
    expect(result.current.onboardingStep).toBe(expectedStep);
    expect(result.current.pickerContext).toEqual(data.pickerContext ?? null);
    expect(result.current.emailOtpDestination).toBe(expectedStep === LOAN_SIM_STEPS.EMAIL_OTP_VALIDATION ? "cliente@example.com" : null);
    expect(result.current.emailPendingAdvisorStatus).toBe(data.requiresAdvisorContact === true ? status : null);
  });

  it.each([
    [null, fallback],
    [{ success: true, data: { estado_onboarding: "PHONE_PICKER" } }, fallback],
    [{ success: true, data: { estado_onboarding: "PHONE_PICKER", pickerContext: null } }, fallback],
    [{ success: true, data: { estado_onboarding: "PHONE_PICKER", pickerContext: {} } }, fallback],
    [{ success: true, data: { estado_onboarding: "PHONE_PICKER", pickerContext: { options: null } } }, fallback],
    [{ success: true, data: { estado_onboarding: "PHONE_PICKER", pickerContext: { options: "1234" } } }, fallback],
    [{ success: true, data: { estado_onboarding: "PHONE_PICKER", pickerContext: { options: ["1", "2", "3"] } } }, fallback],
    [{ success: true, data: { estado_onboarding: "PHONE_PICKER", pickerContext: { options: ["1", "2", "3", "4", "5"] } } }, fallback],
    [{ success: true, data: { estado_onboarding: "PHONE_PICKER", requiresAdvisorContact: "true", pickerContext: { options: ["1", "2", "3", 4] } } }, fallback],
    [{ success: true, message: "Selector incompleto", data: { estado_onboarding: "PHONE_PICKER", pickerContext: null } }, "Selector incompleto"],
    [{ success: false, message: "Servicio no disponible" }, "Servicio no disponible"],
    [{ success: 1, data: { estado_onboarding: "PHONE_PICKER" } }, fallback],
    [{ success: true }, fallback],
    [{ success: true, data: [] }, fallback],
    [{ success: true, data: { estado_onboarding: "UNKNOWN" } }, fallback],
    [{ success: true, data: { estado_onboarding: "EMAIL_PENDING_ADVISOR", requiresAdvisorContact: false } }, fallback],
  ])("preserves the pending screen for invalid response %j", async (response, expectedError) => {
    LeadRegistrationService.obtenerEstadoOnboarding.mockResolvedValueOnce(response);
    const { result } = await renderPending();
    await act(async () => result.current.verificarEstadoEmailPendingAdvisor());
    expect(result.current.onboardingStep).toBe(LOAN_SIM_STEPS.EMAIL_PENDING_ADVISOR);
    expect(result.current.emailPendingAdvisorError).toBe(expectedError);
    expect(result.current.emailPendingAdvisorStatus).toBeNull();
    expect(result.current.checkingEmailPendingAdvisor).toBe(false);
    expect(result.current.restoreError).toBeNull();
  });

  it.each([new Error("Sin conexión"), new Error()])("shows a recoverable request error and clears it on retry", async (error) => {
    LeadRegistrationService.obtenerEstadoOnboarding.mockRejectedValueOnce(error).mockResolvedValueOnce(pending);
    const { result } = await renderPending();
    await act(async () => result.current.verificarEstadoEmailPendingAdvisor());
    expect(result.current.emailPendingAdvisorError).toBe(error.message || fallback);
    expect(result.current.onboardingStep).toBe(LOAN_SIM_STEPS.EMAIL_PENDING_ADVISOR);
    expect(result.current.checkingEmailPendingAdvisor).toBe(false);
    await act(async () => result.current.verificarEstadoEmailPendingAdvisor());
    expect(result.current.emailPendingAdvisorError).toBeNull();
    expect(result.current.emailPendingAdvisorStatus).toBe(status);
    expect(result.current.restoreError).toBeNull();
  });

  it("does not request without a session lead", async () => {
    const { result } = await renderPending();
    act(() => result.current.setLeadToken(null));
    await act(async () => result.current.verificarEstadoEmailPendingAdvisor());
    expect(LeadRegistrationService.obtenerEstadoOnboarding).toHaveBeenCalledTimes(1);
    expect(result.current.emailPendingAdvisorError).toBe("No pudimos recuperar tu sesión. Volvé a iniciar tu solicitud.");
  });

  it("does not request outside the advisor step", async () => {
    const { result } = await renderPending();
    act(() => result.current.setOnboardingStep(LOAN_SIM_STEPS.PHONE_PICKER));
    await act(async () => result.current.verificarEstadoEmailPendingAdvisor());
    expect(LeadRegistrationService.obtenerEstadoOnboarding).toHaveBeenCalledTimes(1);
  });

  it("deduplicates two calls in the same act", async () => {
    let resolve;
    LeadRegistrationService.obtenerEstadoOnboarding.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    const { result } = await renderPending();
    let request;
    act(() => {
      request = result.current.verificarEstadoEmailPendingAdvisor();
      result.current.verificarEstadoEmailPendingAdvisor();
    });
    expect(LeadRegistrationService.obtenerEstadoOnboarding).toHaveBeenCalledTimes(2);
    await act(async () => { resolve(pending); await request; });
  });

  it("aborts the pending request on unmount", async () => {
    LeadRegistrationService.obtenerEstadoOnboarding.mockImplementationOnce(() => new Promise(() => {}));
    const { result, unmount } = await renderPending();
    act(() => { result.current.verificarEstadoEmailPendingAdvisor(); });
    const signal = LeadRegistrationService.obtenerEstadoOnboarding.mock.calls[1][1];
    unmount();
    expect(signal.aborted).toBe(true);
  });

  it.each(["resume", "step", "lead", "token"])("ignores stale success and error after changing %s", async (change) => {
    let resolve;
    let reject;
    LeadRegistrationService.obtenerEstadoOnboarding.mockImplementationOnce(() => new Promise((done, fail) => { resolve = done; reject = fail; }));
    const hook = renderHook(({ resume }) => useOnboardingFlow(resume), { initialProps: { resume: null } });
    await waitFor(() => expect(hook.result.current.restoringOnboarding).toBe(false));
    let request;
    act(() => { request = hook.result.current.verificarEstadoEmailPendingAdvisor(); });
    const signal = LeadRegistrationService.obtenerEstadoOnboarding.mock.calls[1][1];
    if (change === "resume") hook.rerender({ resume: "new-resume" });
    if (change === "step") act(() => hook.result.current.setOnboardingStep(LOAN_SIM_STEPS.RECIBO_UPLOAD));
    if (change === "lead") act(() => hook.result.current.setLeadData({ leadId: 99 }));
    if (change === "token") act(() => hook.result.current.setLeadToken("new-token"));
    expect(signal.aborted).toBe(true);
    expect(hook.result.current.checkingEmailPendingAdvisor).toBe(false);
    const step = hook.result.current.onboardingStep;
    await act(async () => {
      if (change === "token" || change === "resume") reject(new Error("stale error"));
      else resolve({ success: true, data: { estado_onboarding: "RECHAZADO" } });
      await request;
    });
    expect(hook.result.current.onboardingStep).toBe(step);
    expect(hook.result.current.emailPendingAdvisorError).toBeNull();
    expect(hook.result.current.emailPendingAdvisorStatus).toBeNull();
  });

  it.each(["success", "error"])("does not let stale %s release a newer request", async (outcome) => {
    let resolveOld;
    let rejectOld;
    let resolveNew;
    LeadRegistrationService.obtenerEstadoOnboarding
      .mockImplementationOnce(() => new Promise((resolve, reject) => { resolveOld = resolve; rejectOld = reject; }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveNew = resolve; }));
    const { result } = await renderPending();
    let oldRequest;
    let newRequest;
    act(() => { oldRequest = result.current.verificarEstadoEmailPendingAdvisor(); });
    act(() => result.current.setLeadData({ leadId: 99 }));
    act(() => { newRequest = result.current.verificarEstadoEmailPendingAdvisor(); });
    await act(async () => {
      if (outcome === "success") resolveOld({ success: true, data: { estado_onboarding: "RECHAZADO" } });
      else rejectOld(new Error("stale error"));
      await oldRequest;
    });
    expect(result.current.checkingEmailPendingAdvisor).toBe(true);
    expect(result.current.onboardingStep).toBe(LOAN_SIM_STEPS.EMAIL_PENDING_ADVISOR);
    expect(result.current.emailPendingAdvisorError).toBeNull();
    await act(async () => result.current.verificarEstadoEmailPendingAdvisor());
    expect(LeadRegistrationService.obtenerEstadoOnboarding).toHaveBeenCalledTimes(3);
    await act(async () => { resolveNew(pending); await newRequest; });
    expect(result.current.checkingEmailPendingAdvisor).toBe(false);
    expect(result.current.emailPendingAdvisorStatus).toBe(status);
  });
});
