import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import SimuladorService from "../../../services/simuladorService";

/**
 * Maneja la lógica del paso de suscripción a Mobbex.
 *
 * Comportamiento:
 * 1. Si el usuario llega con ?fromMobbex=true (volvió de Mobbex vía returnURL),
 *    auto-llama al endpoint de confirmación y dispara onSubscriptionCompleted.
 * 2. Si no, expone handleSuscribirse para que el componente dispare el redirect.
 *
 * @param {string} scoringId
 * @param {Function} onSubscriptionCompleted - callback para navegar a COMPLETADO
 * @returns {{ isConfirming: boolean, loading: boolean, error: string|null, handleSuscribirse: Function }}
 */
export const useMobbexSubscription = (scoringId, onSubscriptionCompleted) => {
  const [searchParams] = useSearchParams();
  const fromMobbex = searchParams.get("fromMobbex") === "true";
  const linkId = searchParams.get("id");

  const [isConfirming, setIsConfirming] = useState(fromMobbex);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-confirmar al volver de Mobbex
  useEffect(() => {
    if (!fromMobbex) return;

    const confirm = async () => {
      try {
        await SimuladorService.confirmarSuscripcionMobbex({ scoringId });
        onSubscriptionCompleted();
      } catch (err) {
        setError(err.message || "Error al confirmar la suscripción");
      } finally {
        setIsConfirming(false);
      }
    };
    confirm();
  }, [fromMobbex, scoringId, onSubscriptionCompleted]);

  const handleSuscribirse = useCallback(async () => {
    if (!linkId) {
      setError("No se encontró el identificador del link en la URL");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await SimuladorService.solicitarSuscripcionMobbex({ scoringId, linkId });
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
    handleSuscribirse,
  };
};
