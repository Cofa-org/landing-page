import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
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
  const [existingCompliance, setExistingCompliance] = useState(undefined);
  const [bancoEncontrado, setBancoEncontrado] = useState(null);
  const [codigoBancoError, setCodigoBancoError] = useState(null);
  const [validandoBanco, setValidandoBanco] = useState(false);
  // Ref to the AbortController for the current calcularPlanes request.
  // Allows cancelling in-flight fetches when the user changes the capital rapidly.
  const fetchAbortControllerRef = useRef(null);
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
            nombreCompleto: response.data.nombreCompleto || null,
            capitalMaximoOperador: response.data.capitalMaximoOperador || null,
            tasaOperador: response.data.tasaOperador || null,
            plazoMaximoOperador: response.data.plazoMaximoOperador || null,
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

      // Cancel any in-flight request before starting a new one.
      // This prevents stale responses from overwriting newer simulation data
      // when the user moves the capital slider rapidly (race condition fix).
      if (fetchAbortControllerRef.current) {
        fetchAbortControllerRef.current.abort();
      }
      const controller = new AbortController();
      fetchAbortControllerRef.current = controller;

      setLoading(true);
      setError(null);
      try {
        const params = {
          scoringId: scoringData.scoringId,
        };
      
        if(scoringData.tasaOperador && scoringData.plazoMaximoOperador) {
          params.tasaOperador = scoringData.tasaOperador;
          params.plazoMaximoOperador = scoringData.plazoMaximoOperador;
        }

        if (scoringData.capitalMaximoOperador) {
          params.capitalMaximoOperador = scoringData.capitalMaximoOperador;
        }

        if (!isInitial && currentAmount > 0) {
          params.capitalSeleccionado = currentAmount;
        }
        
        const response = await SimuladorService.calcularPlanes(params, controller.signal);

        // Discard response if this request was superseded by a newer one.
        if (controller.signal.aborted) return;

        if (response.success) {
          const newData = response.data;

          setSimulationData(newData);
          const existingState = newData?.existingSimulation?.estado || null;

          if (existingState) {
            setExistingSimulation(newData?.existingSimulation);
            setStep(LOAN_SIM_STEPS[existingState]);

            if (newData?.existingSimulation?.email) {
              setEmail(newData.existingSimulation.email);
            }
          }

          if (isInitial) {
            const capMax = Number(newData.capital_maximo_a_ofrecer);
            setAmount(capMax);
            // Set default to maximum available plan to encourage higher cuota selection.
            const plazosDisponibles = newData.planes_disponibles?.map((p) => p.plazo) || [];
            setInstallment(
              plazosDisponibles.length > 0
                ? Math.max(...plazosDisponibles)
                : (newData.plazo_utilizado ?? null),
            );
          } else {
            // Keep the selected installment if still valid for the new capital;
            // otherwise fall back to the maximum available plan to encourage higher cuota selection.
            const plazosDisponibles = newData.planes_disponibles?.map((p) => p.plazo) || [];
            setInstallment((prev) =>
              plazosDisponibles.includes(prev) ? prev : (Math.max(...plazosDisponibles) ?? null),
            );
          }
        } else {
          setError(response.message || "¡Ups! Ha ocurrido un error en la simulación");
        }
      } catch (err) {
        // Ignore errors from cancelled (aborted) requests — they are expected.
        if (err.name === "AbortError") return;
        setError(err.message || "Error al conectar con el servidor");
        console.error("SIMULATION_HOOK_ERROR:", err);
      } finally {
        // Only clear the loading state if this request is still the active one.
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [scoringData.scoringId],
  );

  useEffect(() => {
    if (scoringData.scoringId) {
      fetchSimulation(0, true);
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
          (p) => p.plazo === installment,
        );

        // Local coherence guard: if the total of installments is less than the
        // selected capital, the simulation data is stale (race condition residue).
        // Stay on SIMULACION and let the user wait for the current fetch to settle.
        if (selectedPlan && installment && amount) {
          const totalCuotas = Number(selectedPlan.valorCuota) * Number(installment);
          if (totalCuotas < Number(amount)) {
            setError(
              "Los datos de la simulación no son consistentes con el capital seleccionado. " +
                "Por favor, esperá un momento y volvé a intentarlo.",
            );
            setLoading(false);
            return;
          }
        }

        const simulationDataWithoutPlans = {
          ...simulationData,
          planes_disponibles: undefined,
        };

        const payload = {
          scoringId: scoringData.scoringId,
          cuit: scoringData.cuit,
          capitalSeleccionado: amount,
          plazoSeleccionado: installment,
          plan: {
            estado: existingSimulation?.email_validado
              ? LOAN_SIM_STEPS.COMPLIANCE // PEP/SO before CBU
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
        } else if (response.success && existingSimulation?.email_validado) {
          setStep(LOAN_SIM_STEPS.COMPLIANCE);
        } else {
          setError(response.message || "¡Ups! Ha ocurrido un error al guardar la simulación");
          return;
        }
      } catch (err) {
        setError(err.message || "Error al guardar la simulación");
        console.error("SAVE_PLAN_ERROR:", err);
      } finally {
        setLoading(false);
      }
    } else if (step === LOAN_SIM_STEPS.EMAIL_VALIDATION) setStep(LOAN_SIM_STEPS.OTP_VALIDATION);
    else if (step === LOAN_SIM_STEPS.OTP_VALIDATION) setStep(LOAN_SIM_STEPS.COMPLIANCE);
    else if (step === LOAN_SIM_STEPS.COMPLIANCE) setStep(LOAN_SIM_STEPS.CBU_VALIDATION);
    else if (step === LOAN_SIM_STEPS.CBU_VALIDATION) setStep(LOAN_SIM_STEPS.COMPLETADO);
  };

  const handlePrevStep = async () => {
    let nextStep = null;
    if (step === LOAN_SIM_STEPS.EMAIL_VALIDATION) nextStep = LOAN_SIM_STEPS.SIMULACION;
    else if (step === LOAN_SIM_STEPS.OTP_VALIDATION) nextStep = LOAN_SIM_STEPS.EMAIL_VALIDATION;
    else if (step === LOAN_SIM_STEPS.COMPLIANCE) nextStep = LOAN_SIM_STEPS.SIMULACION;
    else if (step === LOAN_SIM_STEPS.CBU_VALIDATION) nextStep = LOAN_SIM_STEPS.SIMULACION;

    if (nextStep) {
      try {
        await SimuladorService.actualizarEstado({
          scoringId: scoringData.scoringId,
          estado: nextStep,
        });
        setStep(nextStep);
      } catch (err) {
        console.error("Error al sincronizar estado tras retroceder:", err);
        // Even if the backend fails, we allow local navigation to not block the user
        setStep(nextStep);
      }
    }
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
        setStep(LOAN_SIM_STEPS.COMPLIANCE);
      } else {
        setError(
          response.mensaje ||
            "¡Ups! El código que ingresaste no es correcto. Inténtalo de nuevo 😊",
        );
      }
    } catch (err) {
      setError(
        err.message ||
          "¡Oh no! Hubo un problema al verificar tu código. Por favor, inténtalo otra vez 🤔",
      );
    } finally {
      setValidating(false);
    }
  };

  const guardarCompliance = async (payload) => {
    if (payload?.proceedOnly) {
      setStep(LOAN_SIM_STEPS.CBU_VALIDATION);
      return;
    }
    setValidating(true);
    setError(null);
    try {
      const response = await SimuladorService.guardarCompliance({
        scoringId: scoringData.scoringId,
        cuit: scoringData.cuit,
        ...payload,
      });

      if (response.success || response.data) {
        setStep(LOAN_SIM_STEPS.CBU_VALIDATION);
      } else {
        setError(response.message || "Error al guardar información de compliance");
      }
    } catch (err) {
      setError(err.message || "Error de conexión al guardar compliance");
    } finally {
      setValidating(false);
    }
  };

  const validarCBU = async (cbuValue, accountType = "cbu") => {
    setValidating(true);
    setError(null);
    try {
      const cbuResponse = await SimuladorService.validarCBU(
        cbuValue,
        scoringData.cuit,
        scoringData.scoringId,
        accountType,
      );

      if (!cbuResponse.success) {
        setError(
          cbuResponse.mensaje ||
            "¡Lo sentimos! No pudimos validar tu CBU. Revisá los datos e intentá nuevamente 😕",
        );
        return;
      }

      setCbu(cbuValue);

      // Obtain the pre-approved ID. Handle financial coherence errors separately:
      // the backend resets the state to SIMULACION when they occur, so we redirect
      // the user to redo the simulation instead of showing a generic error.
      const preaprobadoResponse = await SimuladorService.obtenerIdPreaprobado({
        scoringId: scoringData.scoringId,
        cantidad_cuotas: installment,
        monto: amount,
      });

      if (preaprobadoResponse.success) {
        const cookieOptions = {
          name: COOKIE_CONFIG.NAME,
          value: scoringData.scoringId,
          expires: COOKIE_CONFIG.EXPIRY_DAYS,
          partitioned: true,
        };
        await cookieStore.set(cookieOptions);
        setStep(LOAN_SIM_STEPS.COMPLETADO);
      } else {
        const esErrorCoherencia =
          preaprobadoResponse.message?.includes("Inconsistencia financiera") ||
          preaprobadoResponse.message?.includes("COHERENCIA_FINANCIERA_ERROR");

        if (esErrorCoherencia) {
          setError(
            "Los datos de tu simulación han expirado o son inconsistentes. " +
              "Espera unos segundos y podrás realizar una nueva simulación.",
          );
          setTimeout(() => {
            setError(null);
            setStep(LOAN_SIM_STEPS.SIMULACION);
          }, 3000);
          return;
        } else {
          setError(
            preaprobadoResponse.message ||
              "¡Lo sentimos! No pudimos completar la operación, ponete en contacto con un operador 😕",
          );
          return;
        }
      }
    } catch (err) {
      setError(err.message || "¡Ups! Hubo un problema, volvé a intentarlo 🔄");
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
        setError("No se encontró el scoringId. Inténtalo de nuevo.");
        return false;
      }
      const response = await SimuladorService.obtenerInfoPrestamo(scoringId);
      if (response.success) {
        setLoanInfo(response.data);
        return true;
      } else {
        setError("Error al obtener la información del préstamo.");
        return false;
      }
    } catch (error) {
      console.error("Error obteniendo info del préstamo:", error);
      setError("Error al obtener la información del préstamo.");
      return false;
    } finally {
      setLoadingModal(false);
    }
  };

  const verificarComplianceExistente = async () => {
    if (!scoringData.cuit) {
      return;
    }
    setValidating(true);
    try {
      const response = await SimuladorService.verificarComplianceExistente(scoringData.cuit);
      if (response.success && response.exists) {
        setExistingCompliance(response.data);
      } else {
        setExistingCompliance(null);
      }
    } catch (err) {
      console.error("Error verificando compliance:", err);
      setExistingCompliance(null);
    } finally {
      setValidating(false);
    }
  };

  const validarCodigoBancoHandler = useCallback(async (codigoValue, accountType = 'cbu') => {
    // codigoValue ya es el prefijo (3 o 6 dígitos), no el CBU/CVU completo
    const longitudMinima = accountType === 'cvu' ? 8 : 3;
    console.log("Validando código bancario:", { codigoValue, accountType });
    if (codigoValue && codigoValue.length === longitudMinima) {
      setValidandoBanco(true);
      try {
        const response = await SimuladorService.validarCodigoBanco(codigoValue, accountType);
        console.log(response)
        if (response.success && response.exists) {
          setBancoEncontrado(response.data);
          setCodigoBancoError(null);
        } else {
          setBancoEncontrado(null);
          setCodigoBancoError(
            response.message || "Alguno de los dígitos ingresados no es correcto"
          );
        }
      } catch (err) {
        console.error("Error validando código bancario:", err);
        setBancoEncontrado(null);
        setCodigoBancoError("Error al validar el código bancario");
      } finally {
        setValidandoBanco(false);
      }
    }
  }, []);

  return {
    amount,
    installment,
    simulationData,
    loading,
    validating,
    error,
    nombreCompleto: scoringData.nombreCompleto,
    scoringId: scoringData.scoringId,
    step,
    email,
    cuit: scoringData.cuit,
    cbu,
    loanInfo,
    loadingModal,
    setBancoEncontrado,
    bancoEncontrado,
    codigoBancoError,
    setCodigoBancoError,
    validandoBanco,
    handleAmountChange,
    handleInstallmentChange,
    handleNextStep,
    handlePrevStep,
    solicitarOTP,
    verificarOTP,
    guardarCompliance,
    validarCBU,
    validarCodigoBancoHandler,
    handleInfoPrestamo,
    setStep,
    existingCompliance,
    verificarComplianceExistente,
  };
};
