import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { getCookie, roundToFiveHundreds, setCookieWithDuration } from "../../../lib/utils.js";
import { useDebounce } from "../../../hooks/useDebounce";
import SimuladorService from "../../../services/simuladorService";
import { COOKIE_CONFIG, COOKIE_LOAN_INFO_CONFIG, COOKIE_SIMULADOR_TOKEN_CONFIG, LOAN_SIM_STEPS } from "../../../constants/LOAN_SIM.js";
import LinkResolutionService from "../../../services/linkResolutionService.js";
import { ERROR_CAUSE } from "../../../constants/error";
import { getFingerprint, mapFingerprintToHuellaData } from "../../../lib/fingerprint.js";

export const useLoanSimulator = () => {
  const [searchParams] = useSearchParams();
  const [amount, setAmount] = useState(0);
  const [installment, setInstallment] = useState(null);
  const [simulationData, setSimulationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState(null);
  const [scoringData, setScoringData] = useState({ scoringId: null, cuit: null });
  const [step, setStep] = useState(LOAN_SIM_STEPS.LEAD_REGISTRATION);
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
  // Flag que permanece false hasta que la primera llamada a fetchSimulation
  // (post-consumeLink) resuelve. Mientras está false, LoanSimScreen mantiene
  // el loading screen aunque scoringId ya esté seteado — evita que el usuario
  // vea el step SIMULACION (sliders) durante la ventana entre
  // setScoringData y la respuesta con existingSimulation.estado real del
  // servidor (ej: volver de Mobbex → MOBBEX_SUBSCRIPTION). Se setea en el
  // finally de fetchSimulation (no en el try) para que tanto éxito como
  // error liberen el loading.
  const [initialSimulationResolved, setInitialSimulationResolved] = useState(false);
  // Huella del dispositivo (cacheada al iniciar el flujo del simulador)
  const [huellaData, setHuellaData] = useState(null);
  const [huellaRequestId, setHuellaRequestId] = useState(null);
  // Ref to the AbortController for the current calcularPlanes request.
  // Allows cancelling in-flight fetches when the user changes the capital rapidly.
  const fetchAbortControllerRef = useRef(null);
  // Ref to the latest fetchSimulation callback. Updated on every render so the
  // initial/debounced effects can call it without depending on its identity
  // (which would otherwise re-fire the effects when huellaData changes).
  const fetchSimulationRef = useRef(null);
  const shortId = searchParams.get("id");

  useEffect(() => {
    const initVerification = async () => {
      if (!shortId) {
        setStep(LOAN_SIM_STEPS.LEAD_REGISTRATION);
        return;
      }
      setLoading(true);
      setStep(LOAN_SIM_STEPS.SIMULACION);
      try {
       
        const response = await LinkResolutionService.consumeLink(shortId);
        if (response.success && response.data) {
          // Get the fingerprint BEFORE any state update that triggers the initial
          // fetch. This way, scoringId and huellaData are set in the same React
          // batch → 1 re-render → 1 fetchSimulation call → 1 backend insert.
          // If we set scoringId first, the initial fetch effect fires without
          // huellaData; then when huellaData arrives a second render triggers the
          // effect again → 2 calls → 2 simulations persisted.
          let fingerprint = null;
          try {
            fingerprint = await getFingerprint({
              scoringId: response.data.scoringId,
            });
          } catch (fpErr) {
            console.warn("SIMULATOR_FINGERPRINT_ERROR:", fpErr);
          }

          // Intercambiar scoringId/cuit por un JWT del simulador ANTES de
          // setScoringData: si lo hacemos después, el effect que dispara
          // calcularPlanes al detectar scoringId correría antes de que el
          // cookie del token esté escrita → 401 en la primera llamada.
          // Espejo del patrón de useLeadRegistration: tras crearLead, setCookie(COOKIE_LEAD_TOKEN_CONFIG).
          try {
            await SimuladorService.iniciarSesion({
              scoringId: String(response.data.scoringId),
              cuit: response.data.cuit || null,
              shortId: shortId || null,
            });
          } catch (initErr) {
            console.error("INICIAR_SESION_SIMULADOR_ERROR:", initErr);
            setError(
              initErr.message
                ? `${initErr.message} 😊`
                : "No se pudo iniciar la sesión del simulador. Por favor, intenta nuevamente.",
            );
            return;
          }

          // All setState calls below execute in the same synchronous chunk.
          // React 18 batches them into a single render → the initial fetch
          // effect runs exactly once with both scoringId and huellaData ready.
          setScoringData({
            scoringId: String(response.data.scoringId),
            cuit: response.data.cuit || null,
            nombreCompleto: response.data.nombreCompleto || null,
            capitalMaximoOperador: response.data.capitalMaximoOperador || null,
            tasaOperador: response.data.tasaOperador || null,
            plazoMaximoOperador: response.data.plazoMaximoOperador || null,
            cuotaADescontar: response.data.cuotaADescontar || null,
            nroCuota: response.data.nroCuota || null,
            nroPrestamo: response.data.nroPrestamo || null,
            motivo: response.data.motivo || null,
          });

          setHuellaData(mapFingerprintToHuellaData(fingerprint));
          setHuellaRequestId(fingerprint?.requestId || null);
        } else {
          const errorMessage =
            response.message || response.error?.message || "El enlace de acceso es inválido o ha expirado";
          setError(`${errorMessage} 😕`);
        }
      } catch (err) {
        setError(err.message ? `${err.message} 😊` : "Error al verificar el acceso");
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

        if (scoringData.tasaOperador && scoringData.plazoMaximoOperador) {
          params.tasaOperador = scoringData.tasaOperador;
          params.plazoMaximoOperador = scoringData.plazoMaximoOperador;
        }

        if (scoringData.capitalMaximoOperador) {
          params.capitalMaximoOperador = scoringData.capitalMaximoOperador;
        }

        if (scoringData.motivo) {
          params.motivo = scoringData.motivo;
        }

        if (!isInitial && currentAmount > 0) {
          params.capitalSeleccionado = currentAmount;
        }

        // Incluir huella del dispositivo si está disponible
        if (huellaData) {
          params.huella_dispositivo = huellaData;
        }
        if (huellaRequestId) {
          params.request_id = huellaRequestId;
        }

        const response = await SimuladorService.calcularPlanes(params, controller.signal);
     
        // Discard response if this request was superseded by a newer one.
        if (controller.signal.aborted) return;

        if (response.success) {
          const newData = response.data;

          if (scoringData.cuotaADescontar) {
            newData.cuotaADescontar = scoringData.cuotaADescontar;
          }
          if (scoringData.nroCuota) {
            newData.nroCuota = scoringData.nroCuota;
          }
          if (scoringData.nroPrestamo) {
            newData.nroPrestamo = scoringData.nroPrestamo;
          }

          setSimulationData(newData);
          const existingState = newData?.existingSimulation?.estado || null;

          if (existingState) {
            setExistingSimulation(newData?.existingSimulation);
            // No auto-navegar al step DISPOSITIVO_RECHAZADO: el estado viejo puede
            // provenir de una sesión anterior con un device distinto. La validación
            // actual de huella (en este mismo request a calcularPlanes) es la fuente
            // de verdad: si el device actual es válido, esta response llegó con
            // success=true, lo que significa que la validación pasó. Dejamos al
            // usuario en SIMULACION para que pueda continuar con su device legítimo.
            // Si el device actual NO es válido, la response habría llegado con
            // success=false, cause=DEVICE_FINGERPRINT_MISMATCH y la línea 217 ya
            // lo habría mandado a DISPOSITIVO_RECHAZADO.
            if (existingState !== LOAN_SIM_STEPS.DISPOSITIVO_RECHAZADO) {
              setStep(LOAN_SIM_STEPS[existingState]);
            }
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
          if (response.cause === ERROR_CAUSE.DEVICE_FINGERPRINT_MISMATCH) {
            setStep(LOAN_SIM_STEPS.DISPOSITIVO_RECHAZADO);
            return;
          }
          setError(
            response.message
              ? `${response.message} 😊`
              : "¡Ups! Ha ocurrido un error en la simulación",
          );
        }
      } catch (err) {
        // Ignore errors from cancelled (aborted) requests — they are expected.
        if (err.name === "AbortError") return;
        // El catch solo se ejecuta para errores de red/HTTP (response.ok === false).
        // Los errores de aplicación vienen como response.success === false arriba.
        setError(err.message ? `${err.message} 😊` : "Error al conectar con el servidor");
        console.error("SIMULATION_HOOK_ERROR:", err);
      } finally {
        // Only clear the loading state if this request is still the active one.
        if (!controller.signal.aborted) {
          setLoading(false);
          // Libera el loading inicial de LoanSimScreen. Se ejecuta en finally
          // (no try) para que tanto éxito como error liberen el flag — un
          // backend 500 en la primera llamada no debe dejar al usuario en
          // loading eterno. El check !controller.signal.aborted cubre el caso
          // de la primera llamada abortada por una segunda (el flag se setea
          // en el finally de la segunda).
          setInitialSimulationResolved(true);
        }
      }
    },
    [scoringData.scoringId, huellaData, huellaRequestId],
  );

  // Keep the ref pointing to the latest fetchSimulation on every render so the
  // effects below can call the current version without re-firing on reference
  // changes of the useCallback.
  fetchSimulationRef.current = fetchSimulation;

  useEffect(() => {
    if (scoringData.scoringId) {
      fetchSimulationRef.current(0, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoringData.scoringId]);

  useEffect(() => {
    if (debouncedAmount > 0 && scoringData.scoringId) {
      fetchSimulationRef.current(debouncedAmount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedAmount, scoringData.scoringId]);

  const handleAmountChange = (newAmount, discountInstallmentRounded) => {
    if (newAmount <= discountInstallmentRounded) {
      setAmount(discountInstallmentRounded);
      return;
    }
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
          setError(
            response.message
              ? `${response.message} 😊`
              : "¡Ups! Ha ocurrido un error al guardar la simulación",
          );
          return;
        }
      } catch (err) {
        setError(err.message ? `${err.message} 😊` : "Error al guardar la simulación");
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

  const solicitarOTP = async (emailValue) => {
    setValidating(true);
    setError(null);
    try {
      const params = {
        scoringId: scoringData.scoringId,
        email: emailValue,
        isResend: true,
      };
      const response = await SimuladorService.solicitarOTP(params);
      if (response.success || response.data) {
        setEmail(emailValue);
        setStep(LOAN_SIM_STEPS.OTP_VALIDATION);
      } else {
        setError(
          response.message ? `${response.message} 😊` : "Error al validar el email",
        );
      }
    } catch (err) {
      setError(err.message ? `${err.message} 😊` : "Error de conexión al validar email");
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
          response.message
            ? `${response.message} 🤔`
            : "¡Ups! El código que ingresaste no es correcto. Inténtalo de nuevo 😊",
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
        setError(
          response.message
            ? `${response.message} 😊`
            : "Error al guardar información de compliance",
        );
      }
    } catch (err) {
      setError(
        err.message
          ? `${err.message} 😊`
          : "Error de conexión al guardar compliance",
      );
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
          `${cbuResponse.message} 😕` ||
            "¡Lo sentimos! No pudimos validar tu CBU. Revisá los datos e intentá nuevamente 😕",
        );
        return;
      }

      setCbu(cbuValue);

      // Obtain the pre-approved ID. Handle financial coherence errors separately:
      // the backend resets the state to SIMULACION when they occur, so we redirect
      // the user to redo the simulation instead of showing a generic error.
      const aceptarTerminosResponse = await SimuladorService.aceptarTerminos({
        scoringId: scoringData.scoringId,
      });

      if (aceptarTerminosResponse.success) {
        // Cachear cookies al cierre real (no antes — skipMobbex o Mobbex
        // confirmed). Ver `persistLoanToCookies` para el contrato never-throw.
        await persistLoanToCookies(scoringData.scoringId);
        // Si el backend skipeó Mobbex (tarjeta de débito vigente del préstamo
        // anterior), el préstamo ya está creado y la firma ya corrió — ir
        // directo al paso final en vez de forzar al usuario por la pantalla
        // de suscripción. El backend envía este flag en `procesarFirmaYCompletar`.
        const nextStep = aceptarTerminosResponse.skipMobbex
          ? LOAN_SIM_STEPS.COMPLETADO
          : LOAN_SIM_STEPS.MOBBEX_SUBSCRIPTION;
        setStep(nextStep);
      } else {
        const esErrorCoherencia = aceptarTerminosResponse.message?.includes(
          ERROR_CAUSE.COHERENCIA_FINANCIERA_ERROR,
        );

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
            aceptarTerminosResponse.message
              ? `${aceptarTerminosResponse.message} 😊`
              : "¡Lo sentimos! No pudimos completar la operación, ponete en contacto con un operador 😕",
          );
          return;
        }
      }
    } catch (err) {
      setError(err.message ? `${err.message} 😊` : "¡Ups! Hubo un problema, volvé a intentarlo 🔄");
    } finally {
      setValidating(false);
    }
  };

  // Ref para que handleMobbexSubscriptionCompleted tenga identidad estable
  // y no re-dispare el effect de useMobbexSubscription cuando
  // scoringData.scoringId cambie (eso causaría un confirm() duplicado).
  const scoringIdRef = useRef(scoringData.scoringId);
  useEffect(() => {
    scoringIdRef.current = scoringData.scoringId;
  }, [scoringData.scoringId]);

  // Helper: persiste las cookies del préstamo finalizado.
  // Contrato "never throws":
  //   - Si el setCookie de scoringId falla, swalloweamos (otros sistemas
  //     pueden depender de esa cookie, pero el flujo del simulador no).
  //   - Si el fetch o el setCookie de loanInfo fallan, swalloweamos: el
  //     botón de SuccessStep quedará deshabilitado (regla de negocio: sin
  //     loanInfo cookie no hay acceso). El usuario debe contactar a soporte.
  // Se recrea cada render (no es useCallback) — sus callers también lo son.
  const persistLoanToCookies = async (scoringId) => {
    if (!scoringId) return;
    // Cookie scoringId: legacy — se setea para no romper sistemas externos
    // que la busquen. No se usa en el nuevo flujo del simulador.
    try {
      await setCookieWithDuration(
        COOKIE_CONFIG.NAME,
        scoringId,
        COOKIE_CONFIG.EXPIRY_MS,
      );
    } catch (err) {
      console.error("SCORING_ID_COOKIE_ERROR:", err);
    }
    // Cookie loanInfo: regla de negocio. Combina scoringId + data para
    // servir como gate (su existencia = acceso) y como data source. 2h de
    // expiración = ventana de acceso. Sin backend fallback — si esta
    // cookie no se setea (fetch falló), el usuario no tiene acceso.
    try {
      const response = await SimuladorService.obtenerInfoPrestamo(scoringId);
      if (response?.success && response.data) {
        const combined = { scoringId, ...response.data };
        setLoanInfo(response.data);
        await setCookieWithDuration(
          COOKIE_LOAN_INFO_CONFIG.NAME,
          JSON.stringify(combined),
          COOKIE_LOAN_INFO_CONFIG.EXPIRY_MS,
        );
      }
    } catch (err) {
      console.warn("LOAN_INFO_CACHE_ERROR:", err);
    }
  };

  const handleMobbexSubscriptionCompleted = useCallback(async () => {
    try {
      await persistLoanToCookies(scoringIdRef.current);
    } catch (err) {
      console.error("PERSIST_LOAN_COOKIES_ERROR:", err);
    } finally {
      // setStep SIEMPRE corre, incluso si persistLoanToCookies throw
      // (no debería, pero el finally es defensa contra bugs futuros).
      // Sin finally, un throw dejaría al usuario stuck en MOBBEX_SUBSCRIPTION.
      setStep(LOAN_SIM_STEPS.COMPLETADO);
    }
    // deps vacías: scoringId se lee vía ref para mantener identidad estable
  }, []);

  const handleInfoPrestamo = async () => {
    setLoadingModal(true);
    try {
      // Regla de negocio: la única fuente de verdad para "puede ver la info"
      // es la cookie loanInfo (2h desde que se creó el préstamo). La cookie
      // NO es un cache — es el indicador de acceso. Por eso:
      //   - Sin backend fallback (no se concede acceso fuera de la ventana).
      //   - Sin React state fallback para scoringId (no se concede acceso
      //     después de las 2h en la misma sesión).
      // Si la cookie está ausente / corrupta / no es objeto → return false.
      try {
        const raw = await getCookie(COOKIE_LOAN_INFO_CONFIG.NAME);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            // Extraer scoringId si está presente; el resto es la data del préstamo.
            // El modal no necesita scoringId, sólo los campos de display.
            const { scoringId: _scoringId, ...loanData } = parsed;
            setLoanInfo(loanData);
            return true;
          }
        }
      } catch (parseErr) {
        console.warn("LOAN_INFO_COOKIE_READ_ERROR:", parseErr);
      }
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

  const validarCodigoBancoHandler = useCallback(async (codigoValue, accountType = "cbu") => {
    // codigoValue ya es el prefijo (3 o 6 dígitos), no el CBU/CVU completo
    const longitudMinima = accountType === "cvu" ? 6 : 3;

    if (codigoValue && codigoValue.length === longitudMinima) {
      setValidandoBanco(true);
      try {
        const response = await SimuladorService.validarCodigoBanco(codigoValue, accountType);
        if (response.success && response.exists) {
          setBancoEncontrado(response.data);
          setCodigoBancoError(null);
        } else {
          setBancoEncontrado(null);
          setCodigoBancoError(
            response.message
              ? `${response.message} 😊`
              : "Alguno de los dígitos ingresados no es correcto",
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
    initialSimulationResolved,
    handleAmountChange,
    handleInstallmentChange,
    handleNextStep,
    handlePrevStep,
    handleMobbexSubscriptionCompleted,
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
