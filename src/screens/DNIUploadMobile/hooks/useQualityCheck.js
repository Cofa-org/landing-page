import { ERROR_CAUSE, ERROR_MESSAGE } from "../../../constants/camera.constants.js";

const MIN_WIDTH = 640;
const MIN_HEIGHT = 480;
const BLUR_THRESHOLD = 1000;

const BLUR_VALIDATION = {
  [ERROR_CAUSE.CAMERA_BLURRY_PHOTO]: ERROR_MESSAGE.CAMERA_BLURRY_PHOTO,
};

const RESOLUTION_VALIDATION = {
  [ERROR_CAUSE.CAMERA_INSUFFICIENT_RESOLUTION]: ERROR_MESSAGE.CAMERA_INSUFFICIENT_RESOLUTION,
};

/**
 * Valida que la resolución del video sea suficiente para capturar el DNI.
 * @returns {{ ok: true } | { ok: false, cause: string, message: string }}
 */
export function checkResolution(videoEl) {
  if (videoEl.videoWidth < MIN_WIDTH || videoEl.videoHeight < MIN_HEIGHT) {
    return {
      ok: false,
      cause: ERROR_CAUSE.CAMERA_INSUFFICIENT_RESOLUTION,
      message: RESOLUTION_VALIDATION[ERROR_CAUSE.CAMERA_INSUFFICIENT_RESOLUTION],
    };
  }
  return { ok: true };
}

/**
 * Calcula la varianza del Laplaciano sobre el canvas.
 */
export function calculateBlur(canvasEl) {
  const ctx = canvasEl.getContext("2d");
  const { data, width, height } = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);

  // Convertir a escala de grises
  const grises = new Uint8ClampedArray(width * height);
  for (let i = 0; i < data.length; i += 4) {
    grises[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  // Laplaciano con kernel [[0,1,0],[1,-4,1],[0,1,0]]
  let sum = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const laplacian =
        grises[idx - width] +
        grises[idx - 1] +
        grises[idx + 1] +
        grises[idx + width] -
        4 * grises[idx];
      sum += laplacian * laplacian;
      count++;
    }
  }

  return sum / count;
}

/**
 * Valida que la imagen capturada no esté borrosa.
 * @returns {{ ok: true } | { ok: false, cause: string, message: string }}
 */
export function checkBlur(canvasEl) {
  const variance = calculateBlur(canvasEl);
  if (variance < BLUR_THRESHOLD) {
    return {
      ok: false,
      cause: ERROR_CAUSE.CAMERA_BLURRY_PHOTO,
      message: BLUR_VALIDATION[ERROR_CAUSE.CAMERA_BLURRY_PHOTO],
    };
  }
  return { ok: true };
}