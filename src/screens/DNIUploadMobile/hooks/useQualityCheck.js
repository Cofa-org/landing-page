
/** Advisory only; readiness and resource limits are checked by captureFrame. */
export function checkResolution(videoEl) {
  const longer = Math.max(videoEl.videoWidth, videoEl.videoHeight);
  const shorter = Math.min(videoEl.videoWidth, videoEl.videoHeight);
  if (longer < 1000 || shorter < 600) {
    return {
      ok: true,
      warning: "DNI_LOW_RESOLUTION",
      message: "La resolución es baja. Podés confirmar o volver a sacar la foto con otro celular.",
    };
  }
  return { ok: true };
}
