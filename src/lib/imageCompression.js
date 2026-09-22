/**
 * Compresión client-side de imágenes para uploads del wizard de onboarding.
 *
 * Aplica el mismo patrón que `useCameraCapture.captureFrame` (1280 px max-width,
 * JPEG q=0.85) pero a un `File` arbitrario — no a un `HTMLVideoElement`. El
 * uso target es `useReciboUpload.addFileToSlot`, que recibe el `File` desde
 * un `<input type="file">` (no hay stream de cámara).
 *
 * Root cause (memoria [[recibo-heic-load-failed-diagnostic-2026-08-26]]):
 * los HEIC de iPhone pesan 3-8 MB; el multer tiene límite 5 MB en
 * `lead-registration.routes.js:24`. Sin compresión, el 80%+ de los
 * recibos de iPhone rebotan con "File too large". Misma causa raíz
 * que el bug DNI de 2026-07-29 ([[dni-upload-file-size-root-cause-2026-07-29]]),
 * mismo fix: comprimir client-side, NO subir el límite del back.
 *
 * Contrato:
 *   - `compressImageFile(file) → { blob, filename }` (Promise)
 *       - Para imágenes (jpeg/png/webp/heic/heif): re-escala a
 *         max-width 1280, codifica como JPEG q=0.85. Blob es un JPEG
 *         nuevo (el `File` original puede ser PNG, HEIC, etc.).
 *       - Para PDFs / octet-stream / MIMEs desconocidos: pasa el file
 *         original tal cual. Los PDFs de recibos tienen valor probatorio
 *         y no se deben re-codificar.
 *   - `isCompressibleImage(file)`: predicate sobre `file.type`. Exportado
 *     porque `useReciboUpload` lo usa para decidir el flujo "compressing"
 *     vs passthrough sin instanciar el helper.
 *   - `filename` siempre se preserva del `file.name` original — el back
 *     persiste lo que vino en el multipart y la UI muestra
 *     `slot.file?.name` (ver `ReciboSlotTile.jsx:91`).
 *
 * Decodificación: usa `createImageBitmap` cuando está disponible (HEIC
 * nativo en Chromium 94+, WebP nativo, etc.). Si tira (Safari 14-, o
 * browser sin soporte), cae a `<img>` + `onload`. La segunda rama
 * puede fallar con HEIC en Firefox/Linux sin códec — el back tiene
 * `convertHeicToJpg` como segunda red de seguridad.
 */
export const MAX_COMPRESS_WIDTH = 1280;
export const JPEG_QUALITY = 0.85;

const COMPRESSIBLE_MIME_RE = /^image\/(jpeg|png|webp|heic|heif)$/;

export const isCompressibleImage = (file) =>
  Boolean(file) && COMPRESSIBLE_MIME_RE.test(file.type || "");

/**
 * Decodifica un File a un bitmap con dimensiones conocidas. Usa
 * createImageBitmap cuando existe (Chromium 94+, soporta HEIC nativo).
 * Fallback a <img>: Safari 14- no tiene createImageBitmap; HEIC en
 * Safari sí decodifica via <img>, HEIC en Firefox/Linux NO, pero el
 * back tiene convertHeicToJpg como segunda red.
 */
const decodeImage = (file) =>
  new Promise((resolve, reject) => {
    if (typeof createImageBitmap === "function") {
      createImageBitmap(file)
        .then(resolve)
        .catch(() => decodeViaImage(file, resolve, reject));
      return;
    }
    decodeViaImage(file, resolve, reject);
  });

const decodeViaImage = (file, resolve, reject) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    URL.revokeObjectURL(url);
    resolve(img);
  };
  img.onerror = (e) => {
    URL.revokeObjectURL(url);
    reject(e instanceof Error ? e : new Error("image decode failed"));
  };
  img.src = url;
};

const drawToCanvas = (source, sourceWidth, sourceHeight, canvas) => {
  const target = canvas ?? document.createElement("canvas");
  const scale = sourceWidth > MAX_COMPRESS_WIDTH
    ? MAX_COMPRESS_WIDTH / sourceWidth
    : 1;
  const targetWidth = Math.round(sourceWidth * scale);
  const targetHeight = Math.round(sourceHeight * scale);
  target.width = targetWidth;
  target.height = targetHeight;
  const ctx = target.getContext("2d");
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
  return target;
};

const canvasToBlob = (canvas) =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("canvas.toBlob returned null"));
        return;
      }
      resolve(blob);
    }, "image/jpeg", JPEG_QUALITY);
  });

/**
 * Helper compartido: comprime CUALQUIER source compatible con drawImage
 * (HTMLImageElement, HTMLVideoElement, ImageBitmap, HTMLCanvasElement,
 * OffscreenCanvas) a JPEG q=0.85 con max-width 1280.
 *
 * Usado por:
 *   - `compressImageFile` (recibo) → después de decode via createImageBitmap
 *   - `useCameraCapture.captureFrame` (DNI) → con `videoEl` como source
 *
 * El parámetro `canvas` es opcional: si se pasa, se usa como destino
 * (útil para tests y para reusar el canvas del caller). Si no, se crea
 * uno internamente con `document.createElement("canvas")`.
 *
 * El escalado preserva aspect ratio y solo se aplica si sourceWidth >
 * MAX_COMPRESS_WIDTH.
 */
export const compressImageToBlob = async (
  source,
  sourceWidth,
  sourceHeight,
  canvas,
) => {
  const target = drawToCanvas(source, sourceWidth, sourceHeight, canvas);
  return canvasToBlob(target);
};

export const compressImageFile = async (file, canvas) => {
  if (!isCompressibleImage(file)) {
    return { blob: file, filename: file.name };
  }

  const source = await decodeImage(file);
  const sourceWidth = source.width;
  const sourceHeight = source.height;

  let blob;
  try {
    // compressImageToBlob llama internamente a ctx.drawImage(source, ...).
    // El bitmap DEBE estar vivo en ese momento — cerrarlo ANTES de
    // drawImage tira "Failed to execute 'drawImage' on
    // 'CanvasRenderingContext2D': The image source is detached"
    // (regresión 2026-09-14 con JPG > 1MB). Por eso el close va
    // en el finally, después del await.
    blob = await compressImageToBlob(source, sourceWidth, sourceHeight, canvas);
  } finally {
    // createImageBitmap devuelve un bitmap que se debe cerrar
    // (maneja memoria GPU); Image no — el guard es defensivo.
    if (typeof source.close === "function") {
      source.close();
    }
  }
  return { blob, filename: file.name };
};
