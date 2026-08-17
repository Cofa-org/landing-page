import { useState, useCallback } from "react";
import LeadRegistrationService from "../../../services/leadRegistrationService.js";

const ERROR_ALREADY_ATTEMPTED_COPY =
  "Ya verificaste tu celular con este método. Por favor, contactate con un operador para continuar.";
const ERROR_NETWORK_COPY =
  "Hubo un problema al validar tu teléfono. Volvé a intentarlo en unos minutos.";

const ROUTABLE_CAUSES = new Set([
  "OPCION_REQUERIDA",
  "PHONE_PICKER_TARGET_UNRESOLVED",
  "LEAD_NOT_FOUND",
]);

/**
 * Custom hook for the phone picker form submission (knowledge-based auth).
 * Per `manual-validation-tags-2026-08-06` convention: all business logic here,
 * component (PhonePickerStep) is pure presentational.
 *
 * Behavior contract:
 *  - Happy path: returns the service result untouched (caller routes forward).
 *  - PHONE_PICKER_ALREADY_ATTEMPTED: returns the result AND surfaces a
 *    user-facing error message via `error` state (no rethrow — caller stays
 *    on the picker step).
 *  - 4xx causes (OPCION_REQUERIDA, PHONE_PICKER_TARGET_UNRESOLVED, LEAD_NOT_FOUND):
 *    rethrow so the caller can decide routing.
 *  - Network/generic errors: surface via `error` state, no rethrow.
 */
export const usePhonePicker = () => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submitPick = useCallback(async (opcionElegida) => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await LeadRegistrationService.phonePickerPick({ opcionElegida });

      if (result?.success === false && result?.error === "PHONE_PICKER_ALREADY_ATTEMPTED") {
        setError(ERROR_ALREADY_ATTEMPTED_COPY);
      }
      return result;
    } catch (err) {
      if (err?.cause && ROUTABLE_CAUSES.has(err.cause)) {
        setError(err.message || "Revisá el teléfono que elegiste.");
        throw err;
      }
      setError(ERROR_NETWORK_COPY);
      return undefined;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { submitPick, submitting, error };
};
