import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "./useDebounce";
import CalculadoraService from "../services/calculadoraService";
import { getDecodedToken } from "../lib/token";

export const useLoanSimulator = () => {
  const [searchParams] = useSearchParams();
  const [amount, setAmount] = useState(0);
  const [installment, setInstallment] = useState(null);
  const [simulationData, setSimulationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scoringData, setScoringData] = useState({ scoringId: null, cuit: null });

  const debouncedAmount = useDebounce(amount, 500);

  // Initialize scoring data from token
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      const decoded = getDecodedToken(token);

      if (decoded && decoded.scoringId) {
        setScoringData({
          scoringId: String(decoded.scoringId),
          cuit: decoded.cuit || null,
        });
      } else {
        setError("El enlace de acceso es inválido o ha expirado.");
      }
    } else {
      setError("No se ha proporcionado un token de acceso válido.");
    }
  }, [searchParams]);

  const fetchSimulation = useCallback(
    async (currentAmount, currentInstallment, isInitial = false) => {
      if (!scoringData.scoringId) return;

      setLoading(true);
      setError(null);
      try {
        const params = {
          scoringId: scoringData.scoringId,
          plazoSeleccionado: currentInstallment,
        };

        // Only send capitalSeleccionado if it's not the initial call or if amount is specifically set
        if (!isInitial && currentAmount > 0) {
          params.capitalSeleccionado = currentAmount;
        }

        const response = await CalculadoraService.calcularPlanes(params);

        if (response.success) {
          setSimulationData(response.data.data);

          // Set initial values from response if they are not set
          if (isInitial) {
            setAmount(Number(response.data.data.capital_maximo_a_ofrecer));
            setInstallment(response.data.data.plazo_utilizado);
          }
        } else {
          setError(response.mensaje || "Error en la simulación");
        }
      } catch (err) {
        setError(err.message || "Error al conectar con el servidor");
        console.error("SIMULATION_HOOK_ERROR:", err);
      } finally {
        setLoading(false);
      }
    },
    [scoringData.scoringId]
  );

  // Initial load when scoringId is ready
  useEffect(() => {
    if (scoringData.scoringId) {
      fetchSimulation(0, null, true);
    }
  }, [scoringData.scoringId, fetchSimulation]);

  // Update on amount or installment change (debounced for amount)
  useEffect(() => {
    if (simulationData && scoringData.scoringId) {
      fetchSimulation(debouncedAmount, installment);
    }
  }, [debouncedAmount, installment, fetchSimulation, !!simulationData]);

  const handleAmountChange = (newAmount) => {
    setAmount(newAmount);
  };

  const handleInstallmentChange = (newInstallment) => {
    setInstallment(newInstallment);
  };

  return {
    amount,
    installment,
    simulationData,
    loading,
    error,
    cuit: scoringData.cuit,
    handleAmountChange,
    handleInstallmentChange,
  };
};
