import { useState, useCallback } from "react";
import LeadRegistrationService from "../../../services/leadRegistrationService.js";

// Plan 2026-09-29 (cliente email OTP): orquesta `solicitarOTPEmail` y
// `verificarOTPEmail` para el step EMAIL_OTP_VALIDATION. Misma forma que
// `usePhoneOTP` (validating + error state + service delegation) pero sin
// fingerprint (el back ya validó el dispositivo en el OTP celular previo;
// no necesitamos re-capturarlo acá).
export const useEmailOTP = (getLeadId) => {
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState(null);

  const verificarOTPEmail = useCallback(
    async (codigo) => {
      const leadId = getLeadId();
      if (!leadId) return undefined;
      setValidating(true);
      setError(null);
      try {
        const result = await LeadRegistrationService.verificarOTPEmail({
          leadId,
          codigo,
        });
        if (!result.success) {
          setError(
            `${result.message} 😊` ||
              "¡Ups! El código que ingresaste no es correcto. Inténtalo de nuevo 😊",
          );
          return undefined;
        }
        return result;
      } catch (err) {
        // Plan 2026-09-29 (cliente email OTP): a diferencia del OTP celular,
        // el email OTP **rechaza el lead** cuando supera MAX_FAIL_ATTEMPTS
        // (el back ya persiste el rechazo vía `rechazarLead` antes de
        // throw). Si no re-tiramos acá, el caller queda atascado en la
        // pantalla de validación sin saber que debe navegar a RECHAZADO.
        // Re-tiramos para que `handleVerificarEmailOTP` pueda catch + llamar
        // `handleRejected()`.
        const cause = err?.cause || err?.data?.cause;
        setError(
          err.message
            ? `${err.message} 😊`
            : "¡Oh no! Hubo un problema al verificar tu código. Por favor, inténtalo otra vez 🤔",
        );
        if (cause === "OTP_MAX_FAIL_ATTEMPTS_EXCEEDED") {
          throw err;
        }
        return undefined;
      } finally {
        setValidating(false);
      }
    },
    [getLeadId],
  );

  const reenviarOTPEmail = useCallback(async () => {
    const leadId = getLeadId();
    if (!leadId) {
      const e = new Error("Sesión inválida: no se encontró el leadId");
      setError(`${e.message} 😊`);
      throw e;
    }
    setValidating(true);
    setError(null);
    try {
      await LeadRegistrationService.solicitarOTPEmail({ leadId });
    } catch (err) {
      setError(err.message ? `${err.message} 😊` : "Error al reenviar el código");
      throw err;
    } finally {
      setValidating(false);
    }
  }, [getLeadId]);

  return { verificarOTPEmail, reenviarOTPEmail, validating, error };
};
