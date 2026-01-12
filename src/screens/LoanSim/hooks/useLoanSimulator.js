import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "../../../hooks/useDebounce";
import SimuladorService from "../../../services/simuladorService";
import { LOAN_SIM_STEPS } from "../../../constants/LOAN_SIM.js";

export const useLoanSimulator = () => {
  const [searchParams] = useSearchParams();
  const [amount, setAmount] = useState(0);
  const [installment, setInstallment] = useState(null);
  const [simulationData, setSimulationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState(null);
  const [scoringData, setScoringData] = useState({ scoringId: null, cuit: null });
  const [step, setStep] = useState(LOAN_SIM_STEPS.SIMULACION);
  const [email, setEmail] = useState("");
  const [cbu, setCbu] = useState("");

  const debouncedAmount = useDebounce(amount, 500);

  useEffect(() => {
    const initVerification = async () => {
      const token = searchParams.get("token");
      if (!token) {
        setError("No se ha proporcionado un token de acceso válido.");
        return;
      }

      setLoading(true);
      try {
        const response = await SimuladorService.verificarAcceso(token);

        if (response.success && response.data) {
          setScoringData({
            scoringId: String(response.data.scoringId),
            cuit: response.data.cuit || null,
          });
        } else {
          setError(response.mensaje || "El enlace de acceso es inválido o ha expirado.");
        }
      } catch (err) {
        setError(err.message || "Error al verificar el acceso");
        console.error("VERIFY_TOKEN_ERROR:", err);
      } finally {
        setLoading(false);
      }
    };

    initVerification();
  }, [searchParams]);

  const fetchSimulation = useCallback(
    async (currentAmount, isInitial = false) => {
      if (!scoringData.scoringId) return;

      setLoading(true);
      setError(null);
      try {
        const params = {
          scoringId: scoringData.scoringId,
        };

        if (!isInitial && currentAmount > 0) {
          params.capitalSeleccionado = currentAmount;
        }

        const response = await SimuladorService.calcularPlanes(params);

        if (response.success) {
          const newData = response.data;
          const stateToStepMap = {
            SIMULACION: LOAN_SIM_STEPS.EMAIL,
            EMAIL_VALIDATION: LOAN_SIM_STEPS.EMAIL,
            OTP_VALIDATION: LOAN_SIM_STEPS.OTP,
            CBU_VALIDATION: LOAN_SIM_STEPS.CBU,
            COMPLETADO: LOAN_SIM_STEPS.SUCCESS,
          };

          setSimulationData(newData);
          localStorage.setItem("simulation_draft", JSON.stringify(response));

          setSimulationData(newData);
          localStorage.setItem("simulation_draft", JSON.stringify(response));

          if (isInitial) {
   
            const capMax = Number(newData.capital_maximo_a_ofrecer);
            setAmount(capMax);
            setInstallment(newData.plazo_utilizado);
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

  useEffect(() => {
    if (scoringData.scoringId) {
      if (scoringData.scoringId) {
        fetchSimulation(0, true);
      }
    }
  }, [scoringData.scoringId, fetchSimulation]);

  useEffect(() => {
    if (debouncedAmount > 0 && scoringData.scoringId) {
      fetchSimulation(debouncedAmount);
    }
  }, [debouncedAmount, scoringData.scoringId, fetchSimulation]);

  const handleAmountChange = (newAmount) => {
    setAmount(newAmount);
  };

  const handleInstallmentChange = (newInstallment) => {
    setInstallment(newInstallment);
  };

  const handleNextStep = async () => {
    if (step === LOAN_SIM_STEPS.SIMULACION) {
      setLoading(true);
      try {
        const draftJSON = localStorage.getItem("simulation_draft");
        const draft = draftJSON ? JSON.parse(draftJSON) : null;
        const selectedPlan = simulationData?.planes_disponibles?.find(
          (p) => p.plazo === installment
        );

        const simulationDataWithoutPlans = {
          ...simulationData,
          planes_disponibles: undefined,
        };
        const payload = {
          scoringId: scoringData.scoringId,
          capitalSeleccionado: amount,
          plazoSeleccionado: installment,
          plan: {
            ...simulationDataWithoutPlans,
            ...selectedPlan,
          },
        };
     
        const response = await SimuladorService.guardarPlan(payload);
        if (response.success || response.data) {
          setStep(LOAN_SIM_STEPS.EMAIL);
        } else {
          setError(response.mensaje || "Error al guardar la simulación");
        }
      } catch (err) {
        setError(err.message || "Error al guardar la simulación");
        console.error("SAVE_PLAN_ERROR:", err);
      } finally {
        setLoading(false);
      }
    } else if (step === LOAN_SIM_STEPS.EMAIL) setStep(LOAN_SIM_STEPS.OTP);
    else if (step === LOAN_SIM_STEPS.OTP) setStep(LOAN_SIM_STEPS.CBU);
    else if (step === LOAN_SIM_STEPS.CBU) setStep(LOAN_SIM_STEPS.SUCCESS);
  };

  const handlePrevStep = () => {
    if (step === LOAN_SIM_STEPS.EMAIL) setStep(LOAN_SIM_STEPS.SIMULACION);
    else if (step === LOAN_SIM_STEPS.OTP) setStep(LOAN_SIM_STEPS.EMAIL);
  };

  const solicitarOTP = async (emailValue, isResend = false) => {
    setValidating(true);
    setError(null);
    try {
      const params = {
        scoringId: scoringData.scoringId,
        email: emailValue,
        isResend,
      };
      const response = await SimuladorService.solicitarOTP(params);
      if (response.success || response.data) {
        setEmail(emailValue);
        setStep(LOAN_SIM_STEPS.OTP);
      } else {
        setError(response.message || "Error al validar el email");
      }
    } catch (err) {
      setError(err.message || "Error de conexión al validar email");
    } finally {
      setValidating(false);
    }
  };

  const verificarOTP = async (code) => {
    setValidating(true);
    setError(null);
    try {
      const params = {
        code,
        email,
        scoringId: scoringData.scoringId,
      };
      const response = await SimuladorService.verificarOTP(params);
      if (response.success || response.data) {
        setStep(LOAN_SIM_STEPS.CBU);
      } else {
        setError(response.mensaje || "Código inválido");
      }
    } catch (err) {
      setError(err.message || "Error al verificar código");
    } finally {
      setValidating(false);
    }
  };

  const validateCBU = async (cbuValue) => {
    setValidating(true);
    setError(null);
    try {
      const response = await SimuladorService.validarCBU(cbuValue, scoringData.cuit);
      if (response.success || response.data) {
        setCbu(cbuValue);
        await SimuladorService.obtenerIdPreaprobado({
          scoringId: scoringData.scoringId,
          cantidad_cuotas: installment,
          monto: amount,
        });
        setStep(LOAN_SIM_STEPS.SUCCESS);
      } else {
        setError(response.mensaje || "Error al validar el CBU");
      }
    } catch (err) {
      setError(err.message || "Error de conexión al validar CBU");
    } finally {
      setValidating(false);
    }
  };

  return {
    amount,
    installment,
    simulationData,
    loading,
    validating,
    error,
    cuit: scoringData.cuit,
    step,
    email,
    cbu,
    handleAmountChange,
    handleInstallmentChange,
    handleNextStep,
    handlePrevStep,
    solicitarOTP,
    verificarOTP,
    validateCBU,
    setStep,
  };
};
