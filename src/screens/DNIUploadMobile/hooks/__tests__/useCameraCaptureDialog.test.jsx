import { act, renderHook } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { useCameraCaptureDialog } from "../useCameraCaptureDialog.js";

const video = () => Object.assign(new EventTarget(), { readyState: 2, videoWidth: 1920, videoHeight: 1080, play: vi.fn(async () => {}), srcObject: null });
let stop, original, encode;
const setup = (overrides = {}) => {
  const props = { open: true, side: "front", onConfirm: vi.fn(), onCancel: vi.fn(), ...overrides };
  const hook = renderHook(p => useCameraCaptureDialog(p), { initialProps: props });
  act(() => {
    hook.result.current.videoRef.current = video();
    hook.result.current.canvasRef.current = { width: 0, height: 0, getContext: () => ({ drawImage: vi.fn() }), toBlob: (callback, mime) => encode(callback, mime) };
  });
  return { ...hook, props };
};
const takePhoto = async result => {
  await act(async () => {});
  await act(async () => result.current.handleCapture());
};

beforeEach(() => {
  stop = vi.fn(); original = new Blob(["synthetic"], { type: "image/png" });
  encode = vi.fn(callback => callback(original));
  vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: vi.fn(async () => ({ getTracks: () => [{ stop }] })) } });
  let url = 0;
  vi.stubGlobal("URL", { createObjectURL: vi.fn(() => `blob:modal-${++url}`), revokeObjectURL: vi.fn() });
});
afterEach(() => vi.unstubAllGlobals());

describe("candidate lifecycle", () => {
  it("keeps candidate local and confirms original plus rotation only on explicit click", async () => {
    const { result, props, unmount } = setup();
    await takePhoto(result);
    expect(result.current.phase).toBe("preview");
    expect(props.onConfirm).not.toHaveBeenCalled();
    act(() => result.current.handleRotate());
    expect(result.current.rotation).toBe(90);
    expect(encode).toHaveBeenCalledTimes(1);
    act(() => { result.current.handleConfirm(); result.current.handleConfirm(); });
    expect(props.onConfirm).toHaveBeenCalledExactlyOnceWith({ blob: original, width: 1920, height: 1080, rotation: 90 });
    expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith("blob:modal-1");
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledTimes(1);
  });
  it("cancel discards candidate without touching a parent's previous confirmed capture", async () => {
    const { result, props, unmount } = setup(); await takePhoto(result);
    act(() => result.current.handleClose());
    expect(props.onConfirm).not.toHaveBeenCalled();
    expect(props.onCancel).toHaveBeenCalledTimes(1);
    expect(result.current.previewUrl).toBe("");
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  });
  it("rejects encode completing after close, without creating a URL or confirmation", async () => {
    let finish; encode.mockImplementation(callback => { finish = callback; });
    const { result, props } = setup();
    await act(async () => {});
    let pending;
    act(() => { pending = result.current.handleCapture(); });
    act(() => result.current.handleClose());
    await act(async () => { finish(original); await pending; });
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(props.onConfirm).not.toHaveBeenCalled();
    expect(result.current.phase).toBe("idle");
  });
  it("closing while permission pending stops late tracks and never resumes streaming", async () => {
    let permit; navigator.mediaDevices.getUserMedia.mockImplementation(() => new Promise(resolve => { permit = resolve; }));
    const { result, rerender, props } = setup();

    rerender({ ...props, open: false });
    await act(async () => { permit({ getTracks: () => [{ stop }] }); });
    expect(result.current.phase).toBe("idle");
    expect(stop).toHaveBeenCalledTimes(1);
  });
  it("recapture releases only the modal URL and resets rotation", async () => {
    const { result } = setup(); await takePhoto(result);
    await act(async () => { result.current.handleRotate(); result.current.handleRetry(); });
    expect(result.current.rotation).toBe(0);
    expect(result.current.previewUrl).toBe("");
    expect(result.current.phase).toBe("streaming");
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(2);
    expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith("blob:modal-1");
  });
  it("encoder errors expose safe guidance without confirming", async () => {
    encode.mockImplementation(callback => callback(null));
    const { result, props } = setup(); await takePhoto(result);
    expect(result.current.phase).toBe("error");
    expect(result.current.error).toMatch(/foto|captur/i);
    expect(props.onConfirm).not.toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
  it("ignores late video errors after PNG preview without discarding the candidate or its URL", async () => {
    const { result, props } = setup();
    const capturedVideo = result.current.videoRef.current;
    await takePhoto(result);
    const candidateUrl = result.current.previewUrl;
    expect(result.current.phase).toBe("preview");
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    act(() => { capturedVideo.dispatchEvent(new Event("error")); });
    expect(result.current.phase).toBe("preview");
    expect(result.current.previewUrl).toBe(candidateUrl);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    expect(result.current.error).toBe("");
    act(() => result.current.handleConfirm());
    expect(props.onConfirm).toHaveBeenCalledExactlyOnceWith({ blob: original, width: 1920, height: 1080, rotation: 0 });
    expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith(candidateUrl);
  });
  it("keeps low resolution as advisory and permits confirmation", async () => {
    const { result, props } = setup();
    result.current.videoRef.current.videoWidth = 800;
    result.current.videoRef.current.videoHeight = 500;
    await takePhoto(result);
    expect(result.current.warning).toBe("DNI_LOW_RESOLUTION");
    act(() => result.current.handleConfirm());
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
  });
  it("a side change clears the previous candidate and its URL", async () => {
    const { result, props, rerender } = setup(); await takePhoto(result);
    await act(async () => { await act(async () => { rerender({ ...props, side: "back" }); }); });
    expect(result.current.previewUrl).toBe("");
    expect(result.current.phase).toBe("streaming");
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  });
});

it("starts only when opened and avoids another start while streaming", async () => {
 const {result,props,rerender,unmount}=setup({open:false});
 expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
 await act(async()=>{rerender({...props,open:true});});
 expect(result.current.phase).toBe("streaming");
 expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledOnce();
 await act(async()=>result.current.handleStart());
 expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledOnce();
 await act(async()=>{rerender({...props,open:false});});
 expect(stop).toHaveBeenCalledOnce();
 await act(async()=>{rerender({...props,open:true});});
 expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(2);
 unmount();expect(stop).toHaveBeenCalledTimes(2);
});
