import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import SimuladorService from "../../../services/simuladorService";

const MOBBEX_RETRY_MESSAGE =
  "Lo sentimos, necesitamos que repitas la suscripción para poder confirmarla. Volvé a intentarlo para continuar.";

/**
 * Maneja la lógica del paso de suscripción a Mobbex.
 *
 * Comportamiento:
 * 1. Si el usuario llega con ?fromMobbex=true (volvió de Mobbex vía returnURL),
 *    auto-llama al endpoint de confirmación y dispara onSubscriptionCompleted.
 *    Si Mobbex redirige con sid/uid/status, los envía al backend para persistir.
 * 2. Si no, expone handleSuscribirse para que el componente dispare el redirect.
 *
 * @param {string} scoringId
 * @param {Function} onSubscriptionCompleted - callback para navegar a COMPLETADO
 * @returns {{ isConfirming: boolean, loading: boolean, error: string|null, message: string|null, handleSuscribirse: Function }}
 */
export const useMobbexSubscription = (scoringId, onSubscriptionCompleted) => {
  const [searchParams] = useSearchParams();
  const fromMobbex = searchParams.get("fromMobbex") === "true";
  const linkId = searchParams.get("id");
  const mobbexSid = searchParams.get("sid");
  const mobbexUid = searchParams.get("uid");
  const mobbexStatus = searchParams.get("status");

  const [isConfirming, setIsConfirming] = useState(fromMobbex);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Mantener el callback en una ref para que el efecto de auto-confirmación
  // no se re-ejecute si el padre lo recrea en cada render (vi.fn() inline,
  // funciones no memoizadas, etc.). Sin esto, un cambio de referencia del
  // callback re-dispararía el ciclo confirmacion -> setMessage y arruinaría
  // el clear del aviso informativo en handleSuscribirse.
  const onSubscriptionCompletedRef = useRef(onSubscriptionCompleted);
  useEffect(() => {
    onSubscriptionCompletedRef.current = onSubscriptionCompleted;
  });

  // Auto-confirmar al volver de Mobbex
  useEffect(() => {
    if (!fromMobbex) return;

    const confirm = async () => {
      try {
        const response = await SimuladorService.confirmarSuscripcionMobbex({
          scoringId,
          sid: mobbexSid,
          uid: mobbexUid,
          status: mobbexStatus,
        });
        if (!response?.success) {
          if (mobbexStatus === "410") {
            setError(null);
            setMessage(response?.message || MOBBEX_RETRY_MESSAGE);
          } else {
            setMessage(null);
            setError(
              `${response?.message} 😕` ||
                "¡Lo sentimos! No pudimos confirmar tu suscripción. Intentá nuevamente 😕",
            );
          }
          return;
        }
        // Catch defensivo: si onSubscriptionCompleted rompe su contrato
        // never-throw, no queremos una unhandled rejection que deje al usuario
        // stuck en MOBBEX_SUBSCRIPTION. Loggeamos y seguimos.
        setError(null);
        setMessage(null);
        onSubscriptionCompletedRef.current()?.catch?.((err) =>
          console.error("MOBBEX_COMPLETION_CALLBACK_ERROR:", err),
        );
      } catch (err) {
        if (mobbexStatus === "410") {
          setError(null);
          setMessage(err.message || MOBBEX_RETRY_MESSAGE);
        } else {
          setMessage(null);
          setError(err.message || "Error al confirmar la suscripción");
        }
      } finally {
        setIsConfirming(false);
      }
    };
    confirm();
  }, [fromMobbex, scoringId, mobbexSid, mobbexUid, mobbexStatus]);

  const handleSuscribirse = useCallback(async () => {
    if (!linkId) {
      setError("No se encontró el identificador del link en la URL");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await SimuladorService.solicitarSuscripcionMobbex({ scoringId, linkId });
      if (!response?.success) {
        setError(
          `${response?.message} 😕` ||
            "¡Lo sentimos! No pudimos iniciar tu suscripción. Intentá nuevamente 😕",
        );
        setLoading(false);
        return;
      }
      const url = response.data?.subscriptionURL;
      if (!url) {
        throw new Error("No se obtuvo la URL de suscripción");
      }
      window.location.href = url;
    } catch (err) {
      setError(err.message || "Error al obtener la URL de suscripción");
      setLoading(false);
    }
  }, [scoringId, linkId]);

  return {
    isConfirming,
    loading,
    error,
    message,
    handleSuscribirse,
  };
};
