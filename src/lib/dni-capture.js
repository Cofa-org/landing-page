import { DNI_ERRORS, DNI_LIMITS, DNI_ROTATIONS } from "../constants/dni.constants.js";

export function resolveDniCaptureSurface({ userAgentDataMobile, userAgent = "" } = {}) {
  const mobile = typeof userAgentDataMobile === "boolean"
    ? userAgentDataMobile : /iPhone|iPod|Android.*Mobile/i.test(userAgent);
  return mobile ? "phone-camera" : "phone-handoff";
}

export function dniError(cause, side = null) {
  const safeCause = Object.hasOwn(DNI_ERRORS, cause) ? cause : "DNI_TECHNICAL_ERROR";
  const [status, category, retryable, message] = DNI_ERRORS[safeCause];
  return Object.assign(new Error(message), {
    cause: safeCause, status, category, retryable,
    side: side === "front" || side === "back" ? side : null,
    ...(safeCause === "DNI_UPLOAD_BUSY" ? { retryAfterSeconds: 3 } : {}),
  });
}

export function isDniAbort(error) {
  return error?.name === "AbortError";
}

export function normalizeDniError(error) {
  if (isDniAbort(error)) return new DOMException("Operación cancelada", "AbortError");
  if (typeof error?.cause === "string" && Object.hasOwn(DNI_ERRORS, error.cause)) {
    const expectedStatus = DNI_ERRORS[error.cause][0];
    if (error.status == null || error.status === expectedStatus) return dniError(error.cause, error.side ?? error.data?.side);
  }
  if (error instanceof TypeError || error?.name === "NetworkError" || error?.name === "TimeoutError") {
    return dniError("DNI_NETWORK_ERROR");
  }
  return dniError("DNI_TECHNICAL_ERROR");
}

export function validDniDimensions(width, height) {
  return Number.isInteger(width) && Number.isInteger(height) && width > 0 && height > 0
    && width <= DNI_LIMITS.maxAxis && height <= DNI_LIMITS.maxAxis && width * height <= DNI_LIMITS.maxPixels;
}

export function assertDniPng(blob) {
  if (blob?.size > DNI_LIMITS.maxBytes) throw dniError("DNI_FILE_TOO_LARGE");
  if (!(blob instanceof Blob) || blob.type !== "image/png" || blob.size === 0) throw dniError("DNI_IMAGE_INVALID");
}

export function assertDniCapture(capture) {
  assertDniPng(capture?.blob);
  if (!validDniDimensions(capture.width, capture.height)) throw dniError("DNI_IMAGE_LIMIT");
  if (!DNI_ROTATIONS.includes(capture.rotation)) throw dniError("DNI_CAPTURE_INVALID_INPUT");
}

export async function captureFrame(video, canvas) {
  const width = video?.videoWidth;
  const height = video?.videoHeight;
  if (video?.readyState < 2 || !Number.isFinite(video?.readyState) || !validDniDimensions(width, height)) {
    throw dniError("DNI_IMAGE_LIMIT");
  }
  try {
    const context = canvas?.getContext("2d");
    if (!context) throw dniError("DNI_IMAGE_INVALID");
    canvas.width = width;
    canvas.height = height;
    context.drawImage(video, 0, 0, width, height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
    assertDniPng(blob);
    return { blob, width, height };
  } catch (error) {
    throw error?.cause && Object.hasOwn(DNI_ERRORS, error.cause) ? error : dniError("DNI_IMAGE_INVALID");
  }
}

export function normalizeDniId(id) {
  if (typeof id === "number" && Number.isSafeInteger(id) && id > 0) return String(id);
  if (typeof id === "string" && /^[1-9]\d*$/.test(id)) return id;
  return null;
}

export function validDniUuid(uuid) {
  return typeof uuid === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
}

export function validDniContext(context) {
  return typeof context?.solicitudId === "string" && normalizeDniId(context.solicitudId) !== null
    && validDniUuid(context.captureSessionId) && typeof context.baseRevision === "string" && /^[a-f0-9]{64}$/.test(context.baseRevision);
}
