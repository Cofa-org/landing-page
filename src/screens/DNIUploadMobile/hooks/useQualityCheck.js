
import { DNI_GUIDE_OUTPUT_SIZE } from "../../../constants/dni.constants.js";

/** Advisory only; readiness and resource limits are checked by captureFrame. */
export function checkResolution(crop) {
  if (crop.width < DNI_GUIDE_OUTPUT_SIZE.width || crop.height < DNI_GUIDE_OUTPUT_SIZE.height) {
    return {
      ok: true,
      warning: "DNI_LOW_RESOLUTION",
      message: "La resolución del encuadre es baja. Para mejorarla, girá el celular a horizontal o probá con otro celular.",
    };
  }
  return { ok: true };
}
