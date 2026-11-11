import { useState, useCallback, useRef, useEffect } from "react";
import { ERROR_MESSAGE } from "../../../constants/camera.constants.js";
import { captureFrame } from "../../../lib/dni-capture.js";

export const useCameraCapture = () => {
  const [stream, setStream] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");
  const streamRef = useRef(null);
  const generation = useRef(0);
  const mounted = useRef(true);

  const stopCamera = useCallback(() => {
    generation.current += 1;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (mounted.current) { setStream(null); setIsStarting(false); }
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; stopCamera(); };
  }, [stopCamera]);

  const startCamera = useCallback(async () => {
    stopCamera();
    const requestGeneration = generation.current;
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
          width: { ideal: 2000, max: 2560 },
          height: { ideal: 1500, max: 1920 },
        },
        audio: false,
      });

      if (!mounted.current || requestGeneration !== generation.current) {
        mediaStream.getTracks().forEach(track => track.stop());
        return null;
      }
      streamRef.current = mediaStream;
      setStream(mediaStream);
      return mediaStream;
    } catch (err) {
      if (!mounted.current || requestGeneration !== generation.current) return null;
      const errorMessage = mapCameraError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      if (mounted.current && requestGeneration === generation.current) setIsStarting(false);
    }
  }, [stopCamera]);

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
  if (err?.message === ERROR_MESSAGE.CAMERA_HTTPS_REQUIRED) return ERROR_MESSAGE.CAMERA_HTTPS_REQUIRED;
  return ERROR_MESSAGE.CAMERA_NOT_AVAILABLE;
}
