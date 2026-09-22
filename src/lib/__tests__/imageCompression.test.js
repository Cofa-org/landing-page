// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  compressImageFile,
  compressImageToBlob,
  isCompressibleImage,
  MAX_COMPRESS_WIDTH,
  JPEG_QUALITY,
} from "../imageCompression.js";

// Mock HTMLCanvasElement.getContext y toBlob (jsdom no los implementa).
// jsdom 16+ ya tiene width/height como settable own properties en
// HTMLCanvasElement.prototype, así que NO redefinimos via Object.defineProperty
// (causaría "Cannot redefine property" en jsdom reciente).
const setupCanvasMock = () => {
  const toBlob = vi.fn((cb, mimeType, quality) => {
    cb(new Blob(["compressed"], { type: mimeType }));
  });
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    drawImage: vi.fn(),
  }));
  HTMLCanvasElement.prototype.toBlob = toBlob;
  return { toBlob };
};

// Mock ImageBitmap + Image fallback
const setupImageBitmapMock = ({ width, height }) => {
  globalThis.createImageBitmap = vi.fn(async () => ({
    width,
    height,
    close: vi.fn(),
  }));
};

const makeImageFile = (name = "recibo.jpg", type = "image/jpeg", sizeBytes = 1024) =>
  new File(["x".repeat(sizeBytes)], name, { type });

afterEach(() => {
  delete globalThis.createImageBitmap;
});

describe("imageCompression constants", () => {
  it("MAX_COMPRESS_WIDTH is 1280 (mirror of useCameraCapture)", () => {
    expect(MAX_COMPRESS_WIDTH).toBe(1280);
  });

  it("JPEG_QUALITY is 0.85 (mirror of useCameraCapture)", () => {
    expect(JPEG_QUALITY).toBe(0.85);
  });
});

describe("isCompressibleImage", () => {
  it.each([
    ["image/jpeg", true],
    ["image/png", true],
    ["image/webp", true],
    ["image/heic", true],
    ["image/heif", true],
    ["application/pdf", false],
    ["application/octet-stream", false],
    ["", false],
  ])("isCompressibleImage(%j) → %s", (mime, expected) => {
    const f = new File(["x"], "x", { type: mime });
    expect(isCompressibleImage(f)).toBe(expected);
  });
});

describe("compressImageFile — non-image pass-through", () => {
  it("PDF passes through unchanged", async () => {
    const pdf = new File(["pdf-bytes"], "recibo.pdf", { type: "application/pdf" });
    const result = await compressImageFile(pdf);
    expect(result.blob).toBe(pdf);
    expect(result.filename).toBe("recibo.pdf");
  });

  it("application/octet-stream passes through unchanged (HEIC sin MIME)", async () => {
    const f = new File(["x"], "recibo.heic", { type: "application/octet-stream" });
    const result = await compressImageFile(f);
    expect(result.blob).toBe(f);
    expect(result.filename).toBe("recibo.heic");
  });
});

describe("compressImageFile — image re-scaling", () => {
  beforeEach(() => {
    setupCanvasMock();
  });

  it("REGRESIÓN: NO cierra el ImageBitmap antes de drawImage (bug 2026-09-14 'image source is detached')", async () => {
    // El bug: compressImageFile llamaba source.close() ANTES de pasar
    // el bitmap a compressImageToBlob. Eso causaba
    // "Failed to execute 'drawImage' on 'CanvasRenderingContext2D':
    // The image source is detached" en cuanto el usuario cargaba un
    // JPG > 1MB (que es prácticamente cualquier foto moderna). El fix:
    // cerrar DESPUÉS del await compressImageToBlob, no antes.
    //
    // Este test reproduce el bug exacto: mockeamos drawImage para que
    // tire el error real si recibe un bitmap cuyo close() ya se llamó.
    let bitmapClosed = false;
    let bitmapFromCreate;
    globalThis.createImageBitmap = vi.fn(async () => {
      bitmapFromCreate = {
        width: 1920,
        height: 1080,
        close: vi.fn(() => { bitmapClosed = true; }),
      };
      return bitmapFromCreate;
    });
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      drawImage: vi.fn((source) => {
        // Simula el comportamiento real del navegador: si el bitmap ya
        // fue cerrado, drawImage tira "image source is detached".
        if (source === bitmapFromCreate && bitmapClosed) {
          throw new Error(
            "Failed to execute 'drawImage' on 'CanvasRenderingContext2D': The image source is detached"
          );
        }
      }),
    }));

    const f = makeImageFile("big.jpg", "image/jpeg");
    const result = await compressImageFile(f);
    expect(result.blob).toBeInstanceOf(Blob);
    // El bitmap SÍ debe cerrarse, pero DESPUÉS de drawImage.
    expect(bitmapFromCreate.close).toHaveBeenCalledTimes(1);
  });

  it("re-escala imagen 1920x1080 a canvas.width=1280, height=720", async () => {
    setupImageBitmapMock({ width: 1920, height: 1080 });
    const f = makeImageFile("r.jpg", "image/jpeg");
    const canvas = document.createElement("canvas");
    await compressImageFile(f, canvas);
    expect(canvas.width).toBe(1280);
    expect(canvas.height).toBe(720);
  });

  it("preserva aspect ratio para 4032x3024 (HEIC de iPhone)", async () => {
    setupImageBitmapMock({ width: 4032, height: 3024 });
    const f = makeImageFile("r.heic", "image/heic");
    const canvas = document.createElement("canvas");
    await compressImageFile(f, canvas);
    expect(canvas.width).toBe(1280);
    // 1280 * 3024 / 4032 = 960 (round)
    expect(canvas.height).toBe(960);
  });

  it("NO re-escala si imagen ya es <=1280", async () => {
    setupImageBitmapMock({ width: 800, height: 600 });
    const f = makeImageFile("r.jpg", "image/jpeg");
    const canvas = document.createElement("canvas");
    await compressImageFile(f, canvas);
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);
  });

  it("usa JPEG quality 0.85 en canvas.toBlob", async () => {
    const { toBlob } = setupCanvasMock();
    setupImageBitmapMock({ width: 1920, height: 1080 });
    const f = makeImageFile("r.jpg", "image/jpeg");
    await compressImageFile(f);
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), "image/jpeg", 0.85);
  });

  it("preserva filename original del file (no fuerza .jpg)", async () => {
    setupImageBitmapMock({ width: 1000, height: 800 });
    const f = makeImageFile("recibo-de-mayo.png", "image/png");
    const result = await compressImageFile(f);
    expect(result.filename).toBe("recibo-de-mayo.png");
  });

  it("el blob resultante es un JPEG image/jpeg (incluso si original era PNG)", async () => {
    setupImageBitmapMock({ width: 1000, height: 800 });
    const f = makeImageFile("r.png", "image/png");
    const result = await compressImageFile(f);
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.blob.type).toBe("image/jpeg");
  });
});

describe("compressImageFile — fallback a <img> cuando createImageBitmap falla", () => {
  it("usa <img> cuando createImageBitmap throws (Safari 14- no soporta HEIC bitmap)", async () => {
    setupCanvasMock();
    globalThis.createImageBitmap = vi.fn(async () => {
      throw new Error("createImageBitmap: image format not supported");
    });
    // Mock del <img> load
    let imgWidth, imgHeight;
    const origImage = globalThis.Image;
    globalThis.Image = class {
      constructor() {
        this._onload = null;
      }
      set onload(cb) { this._onload = cb; }
      get onload() { return this._onload; }
      set src(_v) {
        Promise.resolve().then(() => {
          if (typeof this._onload === "function") this._onload();
        });
      }
      get naturalWidth() { return imgWidth; }
      get naturalHeight() { return imgHeight; }
    };
    try {
      imgWidth = 1920; imgHeight = 1080;
      const f = makeImageFile("r.jpg", "image/jpeg");
      const result = await compressImageFile(f);
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.filename).toBe("r.jpg");
    } finally {
      globalThis.Image = origImage;
    }
  });
});

describe("compressImageToBlob — shared helper para DNI (useCameraCapture) y recibo", () => {
  beforeEach(() => {
    setupCanvasMock();
  });

  it("re-escala source 1920x1080 a canvas.width=1280, height=720", async () => {
    const source = document.createElement("canvas"); // cualquier source compatible con drawImage
    const target = document.createElement("canvas");
    await compressImageToBlob(source, 1920, 1080, target);
    expect(target.width).toBe(1280);
    expect(target.height).toBe(720);
  });

  it("preserva aspect ratio para source 4032x3024", async () => {
    const source = document.createElement("canvas");
    const target = document.createElement("canvas");
    await compressImageToBlob(source, 4032, 3024, target);
    expect(target.width).toBe(1280);
    expect(target.height).toBe(960); // 1280 * 3024 / 4032 = 960
  });

  it("NO re-escala si source <=1280", async () => {
    const source = document.createElement("canvas");
    const target = document.createElement("canvas");
    await compressImageToBlob(source, 800, 600, target);
    expect(target.width).toBe(800);
    expect(target.height).toBe(600);
  });

  it("usa JPEG quality 0.85 en canvas.toBlob", async () => {
    const { toBlob } = setupCanvasMock();
    const source = document.createElement("canvas");
    const target = document.createElement("canvas");
    await compressImageToBlob(source, 1920, 1080, target);
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), "image/jpeg", 0.85);
  });

  it("el blob resultante es JPEG image/jpeg", async () => {
    const source = document.createElement("canvas");
    const target = document.createElement("canvas");
    const blob = await compressImageToBlob(source, 1000, 800, target);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("image/jpeg");
  });

  it("si NO se pasa canvas, crea uno internamente (compat con compressImageFile)", async () => {
    const source = document.createElement("canvas");
    const blob = await compressImageToBlob(source, 800, 600);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("image/jpeg");
  });
});
