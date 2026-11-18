import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  captureFrame, getDniCropPreviewStyles, getDniGuideCrop, normalizeDniError, projectDniGuide, resolveDniCaptureSurface,
} from "../dni-capture.js";
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
});

describe("DNI guide geometry", () => {
  it.each([
    [1280, 720, { left: 64, top: 0, width: 1152, height: 720 }],
    [1920, 1080, { left: 96, top: 0, width: 1728, height: 1080 }],
    [720, 1280, { left: 0, top: 415, width: 720, height: 450 }],
    [801, 603, { left: 0, top: 51, width: 800, height: 500 }],
    [8, 5, { left: 0, top: 0, width: 8, height: 5 }],
  ])("uses the same integer 8:5 crop as the server for %i × %i", (width, height, expected) => {
    expect(getDniGuideCrop(width, height)).toEqual(expected);
  });

  it.each([[7, 5], [8, 4], [0, 720], [1280, -1], [1280.5, 720], [1280, "720"], [Infinity, 720]])(
    "has no guide for invalid or unframeable dimensions %s × %s", (width, height) => {
      expect(getDniGuideCrop(width, height)).toBeNull();
    });

  it("projects a portrait crop through the horizontal letterboxing of a landscape video box", () => {
    const crop = { left: 0, top: 425, width: 1200, height: 750 };
    const frame = { width: 1200, height: 1600 };
    expect(projectDniGuide(crop, frame, { width: 400, height: 300 }))
      .toEqual({ left: 87.5, top: 79.6875, width: 225, height: 140.625 });
    expect(projectDniGuide(crop, frame, { width: 0, height: 300 })).toBeNull();
  });

  it("positions the full PNG behind the crop window with zoom-independent percentages", () => {
    const crop = { left: 64, top: 0, width: 1152, height: 720 };
    expect(getDniCropPreviewStyles({ width: 1280, height: 720, crop })).toEqual({
      frameStyle: { aspectRatio: 1.6 },
      imageStyle: { left: "-5.555555555555555%", top: "0%", width: "111.11111111111111%", height: "100%" },
    });
  });

  it("warns on a small crop while permitting confirmation and accepts the target size without warning", () => {
    expect(checkResolution({ width: 720, height: 450 })).toMatchObject({ ok: true, warning: "DNI_LOW_RESOLUTION" });
    expect(checkResolution({ width: 1152, height: 720 })).toEqual({ ok: true });
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
