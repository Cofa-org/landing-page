// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCameraCapture } from "../useCameraCapture";

// Mock HTMLCanvasElement.getContext y toBlob (jsdom no los implementa).
const setupCanvasMock = () => {
  const toBlob = vi.fn((cb, mimeType, quality) => {
    cb(new Blob(["x"], { type: mimeType }));
  });
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    drawImage: vi.fn(),
  }));
  HTMLCanvasElement.prototype.toBlob = toBlob;
  return { toBlob };
};

describe("useCameraCapture.captureFrame", () => {
  beforeEach(setupCanvasMock);

  it("re-escala canvas a max-width 1280 cuando video es 1920x1080", async () => {
    const { result } = renderHook(() => useCameraCapture());
    const video = { videoWidth: 1920, videoHeight: 1080 };
    const canvas = document.createElement("canvas");
    await act(async () => {
      await result.current.captureFrame(video, canvas);
    });
    expect(canvas.width).toBe(1280);
    expect(canvas.height).toBe(720);
  });

  it("preserva aspect ratio para video 4032x3024 (cámara 12MP)", async () => {
    const { result } = renderHook(() => useCameraCapture());
    const video = { videoWidth: 4032, videoHeight: 3024 };
    const canvas = document.createElement("canvas");
    await act(async () => {
      await result.current.captureFrame(video, canvas);
    });
    expect(canvas.width).toBe(1280);
    expect(canvas.height).toBe(960); // 1280 * 3024 / 4032 = 960
  });

  it("NO re-escala si video ya es <=1280", async () => {
    const { result } = renderHook(() => useCameraCapture());
    const video = { videoWidth: 800, videoHeight: 600 };
    const canvas = document.createElement("canvas");
    await act(async () => {
      await result.current.captureFrame(video, canvas);
    });
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);
  });

  it("usa JPEG quality 0.85", async () => {
    const { toBlob } = setupCanvasMock();
    const { result } = renderHook(() => useCameraCapture());
    const video = { videoWidth: 1920, videoHeight: 1080 };
    const canvas = document.createElement("canvas");
    await act(async () => {
      await result.current.captureFrame(video, canvas);
    });
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), "image/jpeg", 0.85);
  });
});
