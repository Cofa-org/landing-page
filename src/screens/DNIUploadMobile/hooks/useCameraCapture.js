import { useState, useCallback, useRef } from "react";
import { ERROR_MESSAGE } from "../../../constants/camera.constants.js";

const MAX_CAPTURE_WIDTH = 1280;
const JPEG_QUALITY = 0.85;

export const useCameraCapture = () => {
  const [stream, setStream] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");
  const streamRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  const startCamera = useCallback(async () => {
    setIsStarting(true);
    setError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(ERROR_MESSAGE.CAMERA_NOT_AVAILABLE);
      }

      if (
        typeof window !== "undefined" &&
        window.isSecureContext === false &&
        window.location.hostname !== "localhost"
      ) {
        throw new Error(ERROR_MESSAGE.CAMERA_HTTPS_REQUIRED);
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      return mediaStream;
    } catch (err) {
      const errorMessage = mapCameraError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsStarting(false);
    }
  }, []);

  const captureFrame = useCallback((videoEl, canvasEl) => {
    const ctx = canvasEl.getContext("2d");
    const sourceWidth = videoEl.videoWidth;
    const sourceHeight = videoEl.videoHeight;

    // Re-escalar a max-width 1280 preservando aspect ratio. Para un DNI
    // capturado por cámara de 12MP, baja de 4032×3024 a 1280×960 (o similar).
    // El texto del DNI queda 6-12px de alto en el preview — totalmente legible.
    const scale = sourceWidth > MAX_CAPTURE_WIDTH
      ? MAX_CAPTURE_WIDTH / sourceWidth
      : 1;
    const targetWidth = Math.round(sourceWidth * scale);
    const targetHeight = Math.round(sourceHeight * scale);

    canvasEl.width = targetWidth;
    canvasEl.height = targetHeight;
    ctx.drawImage(videoEl, 0, 0, targetWidth, targetHeight);

    return new Promise((resolve) => {
      canvasEl.toBlob((blob) => resolve(blob), "image/jpeg", JPEG_QUALITY);
    });
  }, []);

  return {
    stream,
    isStarting,
    error,
    startCamera,
    stopCamera,
    captureFrame,
  };
};

function mapCameraError(err) {
  const name = err?.name;
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return ERROR_MESSAGE.CAMERA_PERMISSION_DENIED;
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return ERROR_MESSAGE.CAMERA_NOT_AVAILABLE;
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return ERROR_MESSAGE.CAMERA_IN_USE;
  }
  if (name === "OverconstrainedError") {
    return ERROR_MESSAGE.CAMERA_INSUFFICIENT_RESOLUTION;
  }
  return err?.message || ERROR_MESSAGE.CAMERA_NOT_AVAILABLE;
}
