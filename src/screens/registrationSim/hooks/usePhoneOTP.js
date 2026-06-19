import { useState, useCallback } from "react";
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
        const result = await LeadRegistrationService.verificarOTPCelular({ leadId, codigo });
        console.log(result);
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
      if (!leadId || !destination) return;
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
