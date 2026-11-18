import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useCameraCapture } from "./useCameraCapture.js";
import { checkResolution } from "./useQualityCheck.js";
import { DNI_GUIDE_CAPTURE_PROFILE } from "../../../constants/dni.constants.js";
import { getDniCropPreviewStyles, getDniGuideCrop, normalizeDniError, projectDniGuide } from "../../../lib/dni-capture.js";
import { openCallbellWebchat } from "../../../utils/callbellHelpers.js";

function measureGuide(video) {
  const frame = { width: video.videoWidth, height: video.videoHeight };
  const { width, height } = video.getBoundingClientRect();
  const box = { width, height };
  const crop = getDniGuideCrop(frame.width, frame.height);
  return { frame, box, crop, style: projectDniGuide(crop, frame, box) };
}

function sameGuide(previous, next) {
  return previous?.frame.width === next.frame.width && previous.frame.height === next.frame.height
    && previous.box.width === next.box.width && previous.box.height === next.box.height;
}

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
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState(null);
  const [warningMessage, setWarningMessage] = useState("");
  const [permissionHint, setPermissionHint] = useState(false);
  const [guide, setGuide] = useState(null);
  const { stream, error: cameraError, startCamera, stopCamera, captureFrame } = useCameraCapture();
  const videoAspectRatio = guide?.crop ? guide.frame.width / guide.frame.height : 4 / 3;

  const updateGuide = useCallback(next => setGuide(previous => sameGuide(previous, next) ? previous : next), []);

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
    setPreviewUrl(""); setExpanded(false); setError(""); setWarning(null); setWarningMessage(""); setGuide(null); changePhase("idle");
  }, [changePhase]);

  useEffect(() => {
    const video = videoRef.current;
    if (!open || !stream || !video || lifecycle.current.phase !== "starting") return;
    const generation = lifecycle.current.generation;
    let disposed = false;
    let playbackReady = false;
    const isCurrent = () => !disposed && lifecycle.current.active && generation === lifecycle.current.generation;
    const markReady = () => {
      if (!isCurrent() || !["starting", "streaming"].includes(lifecycle.current.phase) || !playbackReady) return;
      updateGuide(measureGuide(video));
      if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        if (lifecycle.current.phase === "starting") changePhase("streaming");
      }
    };
    const failPlayback = () => {
      if (!isCurrent() || !["starting", "streaming"].includes(lifecycle.current.phase)) return;
      release();
      setError("No pudimos iniciar el video. Reintentá o usá otro navegador compatible en tu celular.");
      changePhase("error");
    };
    const readinessEvents = ["loadeddata", "canplay", "playing", "resize"];
    readinessEvents.forEach(event => video.addEventListener(event, markReady));
    video.addEventListener("error", failPlayback);
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(markReady) : null;
    observer?.observe(video);
    try {
      video.srcObject = stream;
      Promise.resolve(video.play()).then(() => { playbackReady = true; markReady(); }, failPlayback);
    } catch {
      failPlayback();
    }
    return () => {
      disposed = true;
      observer?.disconnect();
      readinessEvents.forEach(event => video.removeEventListener(event, markReady));
      video.removeEventListener("error", failPlayback);
    };
  }, [stream, open, release, changePhase, updateGuide]);

  useLayoutEffect(() => {
    const video = videoRef.current;
    // Opening and aspect changes can resize the CSS box on this commit.
    if (open && phase === "streaming" && video) updateGuide(measureGuide(video));
  }, [open, phase, videoAspectRatio, updateGuide]);

  useEffect(() => {
    setPermissionHint(false);
    if (!open || phase !== "starting" || stream) return;
    const timer = setTimeout(() => setPermissionHint(true), 5000);
    return () => clearTimeout(timer);
  }, [open, phase, stream]);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("dni-camera-open");
    return () => document.body.classList.remove("dni-camera-open");
  }, [open]);

  const handleStart = useCallback(async () => {
    if (!lifecycle.current.active || ["starting", "streaming", "capturing", "preview"].includes(lifecycle.current.phase)) return;
    const generation = ++lifecycle.current.generation;
    setError(""); changePhase("starting");
    try {
      await startCamera();
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
    const video = videoRef.current;
    if (!video) return;
    const measured = measureGuide(video);
    // The shutter must use the guide committed by React, including the current video box.
    if (!sameGuide(guide, measured)) { updateGuide(measured); return; }
    if (!guide.style) return;
    const { crop } = guide;
    const generation = lifecycle.current.generation;
    changePhase("capturing"); setError("");
    try {
      const frame = await captureFrame(video, canvasRef.current);
      if (!lifecycle.current.active || generation !== lifecycle.current.generation) return;
      const url = URL.createObjectURL(frame.blob);
      candidateRef.current = { ...frame, crop, rotation: 0, captureProfile: DNI_GUIDE_CAPTURE_PROFILE, previewUrl: url };
      const resolution = checkResolution(crop);
      setWarning(resolution.warning ?? null); setWarningMessage(resolution.message ?? "");
      setPreviewUrl(url); changePhase("preview");
      stopCamera();
      if (videoRef.current) videoRef.current.srcObject = null;
      if (canvasRef.current) { canvasRef.current.width = 0; canvasRef.current.height = 0; }
    } catch (failure) {
      if (!lifecycle.current.active || generation !== lifecycle.current.generation) return;
      stopCamera(); setError(normalizeDniError(failure).message); changePhase("error");
    }
  }, [guide, updateGuide, captureFrame, stopCamera, changePhase]);

  const handleRetry = useCallback(() => {
    if (!lifecycle.current.active) return;
    release(); reset(); void handleStart();
  }, [release, reset, handleStart]);

  const handleConfirm = useCallback(() => {
    const candidate = candidateRef.current;
    if (!lifecycle.current.active || lifecycle.current.phase !== "preview" || !candidate) return;
    const { previewUrl: _url, ...confirmed } = candidate;
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
    handleClose();
    document.body.classList.remove("dni-camera-open");
    openCallbellWebchat();
  }, [handleClose]);
  const preview = candidateRef.current ? getDniCropPreviewStyles(candidateRef.current) : {};
  return { videoRef, canvasRef, phase, previewUrl, error: error || cameraError, warning, warningMessage,
    videoFrameStyle: { "--camera-aspect": videoAspectRatio }, guideStyle: guide?.style,
    modalRef, titleId, expanded, previewFrameStyle: preview.frameStyle, previewImageStyle: preview.imageStyle, handleZoom, handleContactAdvisor,
    title: `Sacar foto del ${side === "back" ? "dorso" : "frente"}`,
    previewAlt: `Foto del ${side === "back" ? "dorso" : "frente"}`,
    zoomLabel: expanded ? "Reducir foto" : "Ampliar foto",
    // Mount the video on opening, before a fast permission response can arrive.
    showRetry: phase === "error", showStream: ["idle", "starting", "streaming", "capturing"].includes(phase),
    isOpening: phase === "idle" || phase === "starting",
    showPermissionHint: permissionHint && phase === "starting" && !stream,
    canCapture: phase === "streaming" && Boolean(guide?.style),
    captureLabel: phase === "capturing" ? "Capturando…" : "Capturar",
    handleStart, handleCapture, handleRetry, handleConfirm, handleClose };
}
