import { useState, useCallback, useRef } from "react";
import { ERROR_MESSAGE } from "../../../constants/camera.constants.js";

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
    canvasEl.width = videoEl.videoWidth;
    canvasEl.height = videoEl.videoHeight;
    ctx.drawImage(videoEl, 0, 0);

    return new Promise((resolve) => {
      canvasEl.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
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
