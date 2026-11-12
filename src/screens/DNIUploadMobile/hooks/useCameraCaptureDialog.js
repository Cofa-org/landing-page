import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useCameraCapture } from "./useCameraCapture.js";
import { checkResolution } from "./useQualityCheck.js";
import { normalizeDniError } from "../../../lib/dni-capture.js";
import { openCallbellWebchat } from "../../../utils/callbellHelpers.js";

export function useCameraCaptureDialog({ open, side: suppliedSide, tipoFoto, onConfirm, onCancel }) {
  const side = suppliedSide ?? (tipoFoto === "dorso" ? "back" : tipoFoto === "frente" ? "front" : null);
  const videoRef = useRef(null);
  const modalRef = useRef(null);
  const titleId = useId();
  const canvasRef = useRef(null);
  const candidateRef = useRef(null);
  const lifecycle = useRef({ active: false, generation: 0, phase: "idle" });
  const [phase, setPhase] = useState("idle");
  const [previewUrl, setPreviewUrl] = useState("");
  const [rotation, setRotation] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState(null);
  const [warningMessage, setWarningMessage] = useState("");
  const { stream, isStarting, error: cameraError, startCamera, stopCamera, captureFrame } = useCameraCapture();

  const changePhase = useCallback(next => { lifecycle.current.phase = next; setPhase(next); }, []);
  const release = useCallback(() => {
    lifecycle.current.generation += 1;
    stopCamera();
    if (videoRef.current) videoRef.current.srcObject = null;
    if (candidateRef.current) URL.revokeObjectURL(candidateRef.current.previewUrl);
    candidateRef.current = null;
    if (canvasRef.current) { canvasRef.current.width = 0; canvasRef.current.height = 0; }
  }, [stopCamera]);

  const reset = useCallback(() => {
    setPreviewUrl(""); setRotation(0); setExpanded(false); setError(""); setWarning(null); setWarningMessage(""); changePhase("idle");
  }, [changePhase]);

  useEffect(() => {
    const video = videoRef.current;
    if (!open || !stream || !video || phase !== "streaming") return;
    const generation = lifecycle.current.generation;
    video.srcObject = stream;
    Promise.resolve(video.play()).catch(() => {
      if (!lifecycle.current.active || generation !== lifecycle.current.generation || lifecycle.current.phase !== "streaming") return;
      release();
      setError("No pudimos iniciar el video. Reintentá o usá otro navegador compatible en tu celular.");
      changePhase("error");
    });
  }, [stream, open, phase, release, changePhase]);

  const handleStart = useCallback(async () => {
    if (!lifecycle.current.active || ["starting", "streaming", "capturing", "preview"].includes(lifecycle.current.phase)) return;
    const generation = ++lifecycle.current.generation;
    setError(""); changePhase("starting");
    try {
      const cameraStream = await startCamera();
      if (cameraStream && lifecycle.current.active && generation === lifecycle.current.generation) changePhase("streaming");
    } catch (failure) {
      if (lifecycle.current.active && generation === lifecycle.current.generation) {
        // useCameraCapture owns the closed, safe camera message.
        setError(failure.message); changePhase("error");
      }
    }
  }, [startCamera, changePhase]);

  useEffect(() => {
    const life = lifecycle.current;
    life.active = open && (side === "front" || side === "back");
    reset();
    if (life.active) void handleStart();
    return () => { life.active = false; release(); };
  }, [open, side, reset, release, handleStart]);

  const handleCapture = useCallback(async () => {
    if (!lifecycle.current.active || lifecycle.current.phase !== "streaming") return;
    const generation = lifecycle.current.generation;
    changePhase("capturing"); setError("");
    try {
      const frame = await captureFrame(videoRef.current, canvasRef.current);
      if (!lifecycle.current.active || generation !== lifecycle.current.generation) return;
      const url = URL.createObjectURL(frame.blob);
      candidateRef.current = { ...frame, rotation: 0, previewUrl: url };
      const resolution = checkResolution({ videoWidth: frame.width, videoHeight: frame.height });
      setWarning(resolution.warning ?? null); setWarningMessage(resolution.message ?? "");
      setPreviewUrl(url); setRotation(0); changePhase("preview");
      stopCamera();
      if (videoRef.current) videoRef.current.srcObject = null;
      if (canvasRef.current) { canvasRef.current.width = 0; canvasRef.current.height = 0; }
    } catch (failure) {
      if (!lifecycle.current.active || generation !== lifecycle.current.generation) return;
      stopCamera(); setError(normalizeDniError(failure).message); changePhase("error");
    }
  }, [captureFrame, stopCamera, changePhase]);

  const handleRotate = useCallback(() => {
    const candidate = candidateRef.current;
    if (!lifecycle.current.active || lifecycle.current.phase !== "preview" || !candidate) return;
    candidateRef.current = { ...candidate, rotation: (candidate.rotation + 90) % 360 };
    setRotation(candidateRef.current.rotation);
  }, []);

  const handleRetry = useCallback(() => {
    if (!lifecycle.current.active) return;
    release(); reset(); void handleStart();
  }, [release, reset, handleStart]);

  const handleConfirm = useCallback(() => {
    const candidate = candidateRef.current;
    if (!lifecycle.current.active || lifecycle.current.phase !== "preview" || !candidate) return;
    const confirmed = { blob: candidate.blob, width: candidate.width, height: candidate.height, rotation: candidate.rotation };
    lifecycle.current.active = false;
    release(); reset();
    onConfirm(confirmed);
  }, [onConfirm, release, reset]);

  const handleClose = useCallback(() => {
    if (!lifecycle.current.active) return;
    lifecycle.current.active = false;
    release(); reset(); onCancel();
  }, [onCancel, release, reset]);

  // Bind only the open lifecycle: changing a callback must not steal focus.
  const closeRef = useRef(handleClose);
  closeRef.current = handleClose;
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement;
    const dialog = modalRef.current;
    dialog?.querySelector("button")?.focus();
    const handleKeyDown = event => {
      if (event.key === "Escape") { event.preventDefault(); closeRef.current(); return; }
      if (event.key !== "Tab" || !dialog) return;
      const focusable = [...dialog.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]')];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first) { event.preventDefault(); dialog.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    };
    const keepFocus = event => { if (dialog && !dialog.contains(event.target)) dialog.querySelector("button")?.focus(); };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", keepFocus);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", keepFocus);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);
  const handleZoom = useCallback(() => setExpanded(previous => !previous), []);
  const handleContactAdvisor = useCallback(() => {
    openCallbellWebchat();
  }, []);
  const candidate = candidateRef.current;
  const rotated = rotation === 90 || rotation === 270;
  const previewFrameStyle = candidate ? { aspectRatio: rotated ? candidate.height / candidate.width : candidate.width / candidate.height } : undefined;
  const previewImageStyle = candidate ? {
    width: rotated ? `${candidate.width / candidate.height * 100}%` : "100%",
    height: rotated ? `${candidate.height / candidate.width * 100}%` : "100%",
    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
  } : undefined;
  return { videoRef, canvasRef, phase, previewUrl, rotation, error: error || cameraError, warning, warningMessage, isStarting,
    modalRef, titleId, expanded, previewFrameStyle, previewImageStyle, handleZoom, handleContactAdvisor,
    title: `Sacar foto del ${side === "back" ? "dorso" : "frente"}`,
    previewAlt: `Foto del ${side === "back" ? "dorso" : "frente"}`,
    zoomLabel: expanded ? "Reducir foto" : "Ampliar foto",
    showRetry: phase === "error", showStream: phase === "streaming" || phase === "capturing",
    isCapturing: phase === "capturing",
    captureLabel: phase === "capturing" ? "Capturando…" : "Capturar",
    handleStart, handleCapture, handleRotate, handleRetry, handleConfirm, handleClose };
}
