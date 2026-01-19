import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useDebounce } from "../../../hooks/useDebounce";
import SimuladorService from "../../../services/simuladorService";
import { COOKIE_CONFIG, LOAN_SIM_STEPS } from "../../../constants/LOAN_SIM.js";
import LinkResolutionService from "../../../services/linkResolutionService.js";

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
  const [existingSimulation, setExistingSimulation] = useState(null);
  const [loanInfo, setLoanInfo] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);
  const shortId = searchParams.get("id");

  useEffect(() => {
    const initVerification = async () => {
      if (!shortId) {
        setError("No se ha proporcionado un shortId de acceso válido.");
        return;
      }
      setLoading(true);
      try {
        const response = await LinkResolutionService.consumeLink(shortId);

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
        console.error("VERIFY_LINK_ERROR:", err);
      } finally {
        setLoading(false);
      }
    };

    initVerification();
  }, [shortId]);

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

          setSimulationData(newData);
          const existingState = newData?.existingSimulation?.estado || null;

          if (existingState) {
            setExistingSimulation(newData?.existingSimulation);
            setStep(LOAN_SIM_STEPS[existingState]);
          }
          if (isInitial) {
            const capMax = Number(newData.capital_maximo_a_ofrecer);
            setAmount(capMax);
            setInstallment(newData.plazo_utilizado);
          }
        } else {
          setError(response.mensaje || "¡Ups! Ha ocurrido un error en la simulación");
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
            estado: existingSimulation?.email_validado
              ? LOAN_SIM_STEPS.CBU_VALIDATION
              : LOAN_SIM_STEPS.EMAIL_VALIDATION,
            ...simulationDataWithoutPlans,
            ...selectedPlan,
          },
        };

        const response = await SimuladorService.guardarPlan(payload);

        if (
          (response.success && !existingSimulation?.email_validado) ||
          (response.data && !existingSimulation?.email_validado)
        ) {
          setStep(LOAN_SIM_STEPS.EMAIL_VALIDATION);
        } else if (response.success || response.data) setStep(LOAN_SIM_STEPS.CBU_VALIDATION);
        else {
          setError(response.mensaje || "¡Ups! Ha ocurrido un error al guardar la simulación");
        }
      } catch (err) {
        setError(err.message || "Error al guardar la simulación");
        console.error("SAVE_PLAN_ERROR:", err);
      } finally {
        setLoading(false);
      }
    } else if (step === LOAN_SIM_STEPS.EMAIL_VALIDATION) setStep(LOAN_SIM_STEPS.OTP_VALIDATION);
    else if (step === LOAN_SIM_STEPS.OTP_VALIDATION) setStep(LOAN_SIM_STEPS.CBU_VALIDATION);
    else if (step === LOAN_SIM_STEPS.CBU_VALIDATION) setStep(LOAN_SIM_STEPS.COMPLETADO);
  };

  const handlePrevStep = () => {
    if (step === LOAN_SIM_STEPS.EMAIL_VALIDATION) setStep(LOAN_SIM_STEPS.SIMULACION);
    else if (step === LOAN_SIM_STEPS.OTP_VALIDATION) setStep(LOAN_SIM_STEPS.EMAIL_VALIDATION);
    else if (step === LOAN_SIM_STEPS.CBU_VALIDATION) setStep(LOAN_SIM_STEPS.SIMULACION);
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
        setStep(LOAN_SIM_STEPS.OTP_VALIDATION);
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
        setStep(LOAN_SIM_STEPS.CBU_VALIDATION);
      } else {
        setError(
          response.mensaje || "¡Ups! El código que ingresaste no es correcto. Inténtalo de nuevo 😊"
        );
      }
    } catch (err) {
      setError(
        err.message ||
          "¡Oh no! Hubo un problema al verificar tu código. Por favor, inténtalo otra vez 🤔"
      );
    } finally {
      setValidating(false);
    }
  };

  const validarCBU = async (cbuValue) => {
    setValidating(true);
    setError(null);
    try {
      const response = await SimuladorService.validarCBU(cbuValue, scoringData.cuit);
      if (response.success || response.data) {
        setCbu(cbuValue);
        const response = await SimuladorService.obtenerIdPreaprobado({
          scoringId: scoringData.scoringId,
          cantidad_cuotas: installment,
          monto: amount,
        });
        if (response.success) {
          const cookieOptions = {
            name: COOKIE_CONFIG.NAME,
            value: response.data.scoringId,
            expires: COOKIE_CONFIG.EXPIRY_DAYS,
            partitioned: true,
          };
          await cookieStore.set(cookieOptions);
        }
        setStep(LOAN_SIM_STEPS.COMPLETADO);
      } else {
        setError(
          response.mensaje ||
            "¡Lo sentimos! No pudimos validar tu CBU. Revisa los datos e intenta nuevamente 😕"
        );
      }
    } catch (err) {
      setError(err.message || "¡Ups! Hubo un Problema vuelve a intentarlo 🔄");
    } finally {
      setValidating(false);
    }
  };

  const handleInfoPrestamo = async () => {
    setLoadingModal(true);
    try {

      const cookie = await cookieStore.get(COOKIE_CONFIG.NAME);
      const scoringId = cookie?.value;
      if (!scoringId) {
        alert("No se encontró el scoringId. Inténtalo de nuevo.");
        return false;
      }
      const response = await SimuladorService.obtenerInfoPrestamo(scoringId);
      if (response.success) {
        setLoanInfo(response.data);
        return true; // Indicar que se debe mostrar el modal
      } else {
        alert("Error al obtener la información del préstamo.");
        return false;
      }
    } catch (error) {
      console.error("Error obteniendo info del préstamo:", error);
      alert("Error al obtener la información del préstamo.");
      return false;
    } finally {
      setLoadingModal(false);
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
    loanInfo,
    loadingModal,
    handleAmountChange,
    handleInstallmentChange,
    handleNextStep,
    handlePrevStep,
    solicitarOTP,
    verificarOTP,
    validarCBU,
    handleInfoPrestamo,
    setStep,
  };
};
