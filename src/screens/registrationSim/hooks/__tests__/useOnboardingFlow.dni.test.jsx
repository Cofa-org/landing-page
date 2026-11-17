// @vitest-environment jsdom
import { act, renderHook, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useOnboardingFlow } from "../useOnboardingFlow.js";
import Service from "../../../../services/leadRegistrationService.js";
vi.mock("../../../../services/leadRegistrationService.js",()=>({default:{obtenerEstadoOnboarding:vi.fn()}}));
vi.mock("../../../../lib/utils.js",()=>({getCookie:vi.fn().mockResolvedValue("synthetic"),setCookieWithDuration:vi.fn()}));
vi.mock("../../../../lib/token.js",()=>({getDecodedToken:vi.fn(()=>({leadId:"9007199254740993"}))}));
beforeEach(()=>{vi.clearAllMocks();Service.obtenerEstadoOnboarding.mockResolvedValue({success:true,data:{estado_onboarding:"CELULAR_VALIDADO"}});});
afterEach(cleanup);
it.each([
 [{estado_onboarding:"REALIZADO"},"WELCOME"],
 [{estado_onboarding:"EN_ANALISIS"},"EN_ANALISIS"],
 [{estado_onboarding:"RECHAZADO"},"RECHAZADO"],
 [{estado_onboarding:"DNI_SUBIDO",emailOtpDestination:"synthetic@example.test"},"EMAIL_OTP_VALIDATION"],
 [{estado_onboarding:"REALIZADO",requiresAdvisorContact:true,emailOtpDestination:"synthetic@example.test"},"EMAIL_PENDING_ADVISOR"],
])("DNI continuation reapplies mapper and gates %j",async(state,step)=>{
 const {result}=renderHook(()=>useOnboardingFlow());await waitFor(()=>expect(result.current.restoringOnboarding).toBe(false));
 Service.obtenerEstadoOnboarding.mockResolvedValue({success:true,data:state});
 await act(async()=>result.current.handleDniReceived());expect(result.current.onboardingStep).toBe(step);
 expect(Service.obtenerEstadoOnboarding.mock.calls.at(-1)[0]).toBe("9007199254740993");
});
it("failed restore rejects safely while keeping DNI step",async()=>{
 const {result}=renderHook(()=>useOnboardingFlow());await waitFor(()=>expect(result.current.restoringOnboarding).toBe(false));
 Service.obtenerEstadoOnboarding.mockResolvedValue({success:false,message:"raw-canary"});
 await act(async()=>{await expect(result.current.handleDniReceived()).rejects.toThrow("Tus fotos se guardaron");});
 expect(result.current.onboardingStep).toBe("DNI_UPLOAD");
});
