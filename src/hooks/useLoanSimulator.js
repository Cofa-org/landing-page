import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "./useDebounce";
import CalculadoraService from "../services/calculadoraService";

export const useLoanSimulator = (initialScoringId = "33655") => {
  const [amount, setAmount] = useState(0);
  const [installment, setInstallment] = useState(null);
  const [simulationData, setSimulationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const debouncedAmount = useDebounce(amount, 500);

  const fetchSimulation = useCallback(
    async (currentAmount, currentInstallment, isInitial = false) => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          scoringId: initialScoringId,
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
    [initialScoringId]
  );

  // Initial load
  useEffect(() => {
    fetchSimulation(0, null, true);
  }, [fetchSimulation]);

  // Update on amount or installment change (debounced for amount)
  useEffect(() => {
    if (simulationData) {
      fetchSimulation(debouncedAmount, installment);
    }
  }, [debouncedAmount, installment, fetchSimulation, simulationData ? true : false]);

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
    handleAmountChange,
    handleInstallmentChange,
  };
};
