// @vitest-environment jsdom
import { act, renderHook, cleanup } from "@testing-library/react";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { useDNIPolling } from "../useDNIPolling.js";
import Service from "../../../../services/leadRegistrationService.js";
vi.mock("../../../../services/leadRegistrationService.js", () => ({ default:{ obtenerContextoDni:vi.fn() } }));
const context={ solicitudId:"91", captureSessionId:"11111111-1111-4111-8111-111111111111", baseRevision:"a".repeat(64) };
const snapshot=(extra={})=>({success:true,data:{...context,estado_onboarding:"CELULAR_VALIDADO",canCapture:true,dniReceivedForSession:false,receivedUploadId:null,receiptKind:"none",...extra}});
beforeEach(()=>{ vi.useFakeTimers(); vi.clearAllMocks(); Service.obtenerContextoDni.mockResolvedValue(snapshot()); });
afterEach(()=>{ cleanup(); vi.useRealTimers(); });
it("waits 3 seconds after completion and never overlaps requests",async()=>{
 let resolve; Service.obtenerContextoDni.mockImplementationOnce(()=>new Promise(r=>{resolve=r;}));
 const {result}=renderHook(()=>useDNIPolling("42","synthetic",context));
 act(()=>result.current.startPolling(vi.fn()));
 await act(async()=>vi.advanceTimersByTimeAsync(3000));
 expect(Service.obtenerContextoDni).toHaveBeenCalledTimes(1);
 await act(async()=>vi.advanceTimersByTimeAsync(30000));
 expect(Service.obtenerContextoDni).toHaveBeenCalledTimes(1);
 await act(async()=>resolve(snapshot()));
 await act(async()=>vi.advanceTimersByTimeAsync(2999));
 expect(Service.obtenerContextoDni).toHaveBeenCalledTimes(1);
 await act(async()=>vi.advanceTimersByTimeAsync(1));
 expect(Service.obtenerContextoDni).toHaveBeenCalledTimes(2);
 expect(Service.obtenerContextoDni.mock.calls[0]).toEqual(["42",{tokenOverride:"synthetic",signal:expect.any(AbortSignal)}]);
});
it("accepts own receipt despite own revision change",async()=>{
 Service.obtenerContextoDni.mockResolvedValue(snapshot({baseRevision:"b".repeat(64),dniReceivedForSession:true,receiptKind:"current_session",receivedUploadId:"22222222-2222-4222-8222-222222222222",estado_onboarding:"DNI_SUBIDO"}));
 const received=vi.fn();const {result}=renderHook(()=>useDNIPolling("42","synthetic",context));
 act(()=>result.current.startPolling(received));await act(async()=>vi.advanceTimersByTimeAsync(3000));
 expect(received).toHaveBeenCalledExactlyOnceWith({received:true});expect(result.current.isPolling).toBe(false);
});
it.each([{captureSessionId:"33333333-3333-4333-8333-333333333333"},{baseRevision:"b".repeat(64)}])("stops for changed context %j",async(extra)=>{
 Service.obtenerContextoDni.mockResolvedValue(snapshot(extra));const received=vi.fn();const {result}=renderHook(()=>useDNIPolling("42","synthetic",context));
 act(()=>result.current.startPolling(received));await act(async()=>vi.advanceTimersByTimeAsync(3000));
 expect(received).not.toHaveBeenCalled();expect(result.current.isPolling).toBe(false);expect(result.current.pollingError).toMatch(/contexto|captura/i);
});
it("restores rejected state without claiming receipt",async()=>{
 Service.obtenerContextoDni.mockResolvedValue(snapshot({canCapture:false,estado_onboarding:"RECHAZADO"}));const received=vi.fn();const {result}=renderHook(()=>useDNIPolling("42","synthetic",context));
 act(()=>result.current.startPolling(received));await act(async()=>vi.advanceTimersByTimeAsync(3000));expect(received).toHaveBeenCalledExactlyOnceWith({received:false});
});
it("makes exactly 100 queries and aborts on cleanup",async()=>{
 const {result,unmount}=renderHook(()=>useDNIPolling("42","synthetic",context));act(()=>result.current.startPolling(vi.fn()));
 await act(async()=>vi.advanceTimersByTimeAsync(303000));expect(Service.obtenerContextoDni).toHaveBeenCalledTimes(100);expect(result.current.isPolling).toBe(false);
 act(()=>result.current.startPolling(vi.fn()));await act(async()=>vi.advanceTimersByTimeAsync(3000));const signal=Service.obtenerContextoDni.mock.calls.at(-1)[1].signal;unmount();expect(signal.aborted).toBe(true);
});
it("marks polling stopped when fixed identity changes and ignores a late receipt",async()=>{
 let resolve;Service.obtenerContextoDni.mockImplementation(()=>new Promise(r=>{resolve=r;}));
 const received=vi.fn();const {result,rerender}=renderHook(({bound})=>useDNIPolling("42","synthetic",bound),{initialProps:{bound:context}});
 act(()=>result.current.startPolling(received));await act(async()=>vi.advanceTimersByTimeAsync(3000));
 const signal=Service.obtenerContextoDni.mock.calls[0][1].signal;
 rerender({bound:{...context,captureSessionId:"33333333-3333-4333-8333-333333333333"}});
 expect(result.current.isPolling).toBe(false);expect(signal.aborted).toBe(true);
 await act(async()=>resolve(snapshot({dniReceivedForSession:true,receiptKind:"current_session",receivedUploadId:"22222222-2222-4222-8222-222222222222"})));
 expect(received).not.toHaveBeenCalled();
});
