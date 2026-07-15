import { ERROR_CAUSE, ERROR_MESSAGE } from "../../../constants/camera.constants.js";

const MIN_WIDTH = 640;
const MIN_HEIGHT = 480;

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