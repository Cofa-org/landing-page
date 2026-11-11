import { beforeEach, describe, expect, it, vi } from "vitest";
import { captureFrame, resolveDniCaptureSurface, normalizeDniError } from "../dni-capture.js";
import { checkResolution } from "../../screens/DNIUploadMobile/hooks/useQualityCheck.js";

describe("DNI surface is a UX choice only", () => {
  it.each([
    [{ userAgentDataMobile: false, userAgent: "iPhone" }, "phone-handoff"],
    [{ userAgentDataMobile: true, userAgent: "unknown" }, "phone-camera"],
    [{ userAgent: "Mozilla iPhone" }, "phone-camera"],
    [{ userAgent: "Mozilla Android Mobile" }, "phone-camera"],
    [{ userAgent: "Mozilla Android Tablet" }, "phone-handoff"],
    [{ userAgent: "Mozilla iPad" }, "phone-handoff"],
    [{ userAgent: "Windows", coarse: true, width: 390, webcam: true }, "phone-handoff"],
    [{}, "phone-handoff"],
  ])("resolves %j", (input, want) => expect(resolveDniCaptureSurface(input)).toBe(want));
});

describe("full frame PNG", () => {
  let canvas;
  const video = { readyState: 2, videoWidth: 1920, videoHeight: 1080 };
  beforeEach(() => {
    canvas = { width: 0, height: 0, getContext: vi.fn(() => ({ drawImage: vi.fn() })),
      toBlob: vi.fn(cb => cb(new Blob(["synthetic"], { type: "image/png" }))) };
  });
  it("encodes real dimensions once as PNG without JPEG or resizing", async () => {
    const captured = await captureFrame(video, canvas);
    expect(captured).toMatchObject({ width: 1920, height: 1080, blob: expect.any(Blob) });
    expect(canvas.width).toBe(1920);
    expect(canvas.height).toBe(1080);
    expect(canvas.getContext.mock.results[0].value.drawImage).toHaveBeenCalledWith(video, 0, 0, 1920, 1080);
    expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), "image/png");
  });
  it.each([
    { ...video, readyState: 1 }, { ...video, videoWidth: 0 },
    { ...video, videoWidth: 8193 }, { ...video, videoWidth: 5000, videoHeight: 4000 },
  ])("rejects unusable frame before allocating canvas %j", async frame => {
    await expect(captureFrame(frame, canvas)).rejects.toMatchObject({ cause: "DNI_IMAGE_LIMIT" });
    expect(canvas.width).toBe(0);
    expect(canvas.toBlob).not.toHaveBeenCalled();
  });
  it.each([null, new Blob([], { type: "image/png" }), new Blob(["x"], { type: "image/jpeg" }), { type: "image/png", size: 20971521 }])(
    "rejects null, empty, non-PNG or oversized encoder output", async blob => {
      canvas.toBlob.mockImplementation(cb => cb(blob));
      await expect(captureFrame(video, canvas)).rejects.toMatchObject({ cause: expect.stringMatching(/^DNI_/) });
    });
  it("rejects missing canvas context with own safe error", async () => {
    canvas.getContext.mockReturnValue(null);
    await expect(captureFrame(video, canvas)).rejects.toMatchObject({ cause: "DNI_IMAGE_INVALID" });
  });
  it("warns on low resolution in either orientation while permitting confirmation", () => {
    expect(checkResolution({ videoWidth: 500, videoHeight: 900 })).toMatchObject({ ok: true, warning: "DNI_LOW_RESOLUTION" });
    expect(checkResolution({ videoWidth: 600, videoHeight: 1000 })).toEqual({ ok: true });
  });
});

describe("closed error mapping", () => {
  it.each([
    ["DNI_CAPTURE_NOT_FOUND", 404, false], ["DNI_UPLOAD_BUSY", 429, true],
    ["DNI_CAPTURE_CONTEXT_CHANGED", 409, false], ["DNI_IMAGE_INVALID", 422, false],
  ])("keeps allowlisted %s and safe guidance", (cause, status, retryable) => {
    const error = normalizeDniError({ cause, status, message: "raw PII", data: { side: "front", retryable: !retryable } });
    expect(error).toMatchObject({ cause, status, retryable });
    expect(error.message).not.toContain("raw PII");
  });
  it("drops unknown cause/message/body", () => {
    expect(normalizeDniError({ cause: "external", status: 500, message: "raw PII" })).toMatchObject({ cause: "DNI_TECHNICAL_ERROR", status: 502 });
  });
});
