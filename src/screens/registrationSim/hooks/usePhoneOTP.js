import { useState, useCallback } from "react";
import { getFingerprint, mapFingerprintToHuellaData } from "../../../lib/fingerprint.js";
import LeadRegistrationService from "../../../services/leadRegistrationService.js";

export const usePhoneOTP = (getLeadId) => {
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState(null);

  const verificarOTP = useCallback(
    async (codigo) => {
      const leadId = getLeadId();

      if (!leadId) return;
      setValidating(true);
      setError(null);
      try {
        // Capturar fingerprint ANTES de validar OTP. Si el cliente llega a
        // este step, ya pasó los gates de crearLead (FALLECIDO, OTROS).
        // Si el OTP es incorrecto, el fingerprint queda orphaned en DB
        // (no se vincula al lead), pero no se registra ningún device.
        let fingerprint = null;
        try {
          fingerprint = await getFingerprint({ leadId });
        } catch (err) {
          console.warn("Fingerprint could not be obtained:", err);
        }
        const huellaData = mapFingerprintToHuellaData(fingerprint);
        const requestId = fingerprint?.requestId || null;

        const result = await LeadRegistrationService.verificarOTPCelular({
          leadId,
          codigo,
          huella_dispositivo: huellaData,
          requestId,
        });

        // Phone picker trigger (knowledge-based auth fallback): el back indica
        // que el OTP no aplica y devuelve opciones para que el usuario confirme
        // cuál es su celular. Se surface sin tocar `error` para que el caller
        // (OnboardingFlowScreen) navegue a PHONE_PICKER.
        if (result?.requiresPhonePicker) {
          return result;
        }

        if (!result.success) {
          setError(
            `${result.message} 😊` ||
              "¡Ups! El código que ingresaste no es correcto. Inténtalo de nuevo 😊",
          );
          return;
        }
        return result;
      } catch (err) {
        setError(
          "¡Oh no! Hubo un problema al verificar tu código. Por favor, inténtalo otra vez 🤔",
        );
      } finally {
        setValidating(false);
      }
    },
    [getLeadId],
  );

  const reenviarOTP = useCallback(
    async (destination) => {
      const leadId = getLeadId();
      // Patch 2026-08-31 (OTP resend fix): defense-in-depth. Antes un
      // `return` silencioso cuando faltaba `leadId` o `destination` permitía
      // que `handleResendClick` (useOTPValidation.js) arrancara el cooldown
      // de 120s sin disparar la API al back. Surface el problema al caller
      // para que NO setee el timer y para que el hook de presentación
      // muestre el error en pantalla.
      if (!leadId) {
        const error = new Error("Sesión inválida: no se encontró el leadId");
        setError(`${error.message} 😊`);
        throw error;
      }
      if (!destination) {
        const error = new Error(
          "Falta el número de celular para reenviar el código",
        );
        setError(`${error.message} 😊`);
        throw error;
      }
      setValidating(true);
      setError(null);
      try {
        await LeadRegistrationService.solicitarOTPCelular({ leadId, celular: destination });
      } catch (err) {
        setError(err.message ? `${err.message} 😊` : "Error al reenviar el código");
        throw err;
      } finally {
        setValidating(false);
      }
    },
    [getLeadId],
  );

  return { verificarOTP, reenviarOTP, validating, error };
};
