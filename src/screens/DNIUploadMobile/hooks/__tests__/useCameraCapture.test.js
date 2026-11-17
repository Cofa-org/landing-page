import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCameraCapture } from "../useCameraCapture.js";

describe("camera lifecycle", () => {
  beforeEach(() => vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: vi.fn() } }));
  afterEach(() => vi.unstubAllGlobals());

  it("requests environment at ideal 2000x1500 and accepts lower actual resolution", async () => {
    const stream = { getTracks: () => [{ stop: vi.fn() }] };
    navigator.mediaDevices.getUserMedia.mockResolvedValue(stream);
    const { result, unmount } = renderHook(useCameraCapture);
    await act(async () => expect(await result.current.startCamera()).toBe(stream));
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: false, video: {
      facingMode: { ideal: "environment" }, width: { ideal: 2000, max: 2560 }, height: { ideal: 1500, max: 1920 },
    } });
    unmount();
  });

  it("stops permission results arriving after close without reopening", async () => {
    let resolve;
    navigator.mediaDevices.getUserMedia.mockImplementation(() => new Promise(r => { resolve = r; }));
    const stop = vi.fn();
    const { result } = renderHook(useCameraCapture);
    let pending;
    act(() => { pending = result.current.startCamera(); });
    act(() => result.current.stopCamera());
    await act(async () => { resolve({ getTracks: () => [{ stop }] }); expect(await pending).toBeNull(); });
    expect(stop).toHaveBeenCalledTimes(1);
    expect(result.current.stream).toBeNull();
    expect(result.current.isStarting).toBe(false);
  });

  it("stops owned tracks once on stop and unmount", async () => {
    const stop = vi.fn();
    navigator.mediaDevices.getUserMedia.mockResolvedValue({ getTracks: () => [{ stop }] });
    const { result, unmount } = renderHook(useCameraCapture);
    await act(async () => result.current.startCamera());
    act(() => { result.current.stopCamera(); result.current.stopCamera(); });
    unmount();
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it("uses a closed permission message, never the browser raw error", async () => {
    navigator.mediaDevices.getUserMedia.mockRejectedValue(Object.assign(new Error("sensitive raw value"), { name: "NotAllowedError" }));
    const { result } = renderHook(useCameraCapture);
    await act(async () => { await expect(result.current.startCamera()).rejects.toThrow(); });
    expect(result.current.error).toMatch(/permiso|cámara/i);
    expect(result.current.error).not.toContain("sensitive");
  });

  it("keeps only the latest camera request when permission promises resolve out of order", async () => {
    let firstResolve;
    const oldStop = vi.fn();
    const currentStop = vi.fn();
    const currentStream = { getTracks: () => [{ stop: currentStop }] };
    navigator.mediaDevices.getUserMedia.mockImplementationOnce(() => new Promise(resolve => { firstResolve = resolve; }))
      .mockResolvedValueOnce(currentStream);
    const { result, unmount } = renderHook(useCameraCapture);
    let first;
    act(() => { first = result.current.startCamera(); });
    await act(async () => result.current.startCamera());
    await act(async () => { firstResolve({ getTracks: () => [{ stop: oldStop }] }); expect(await first).toBeNull(); });
    expect(result.current.stream).toBe(currentStream);
    expect(oldStop).toHaveBeenCalledTimes(1);
    expect(currentStop).not.toHaveBeenCalled();
    unmount();
    expect(currentStop).toHaveBeenCalledTimes(1);
  });
});
