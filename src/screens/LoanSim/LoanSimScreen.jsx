import { useEffect, lazy, Suspense } from "react";
import { toggleCallbellWebchat } from "../../utils/callbellHelpers";
import GenericButton from "../../Components/buttons/GenericButton/GenericButton.jsx";
import BackButton from "../../Components/buttons/backbutton/BackButton.jsx";
import { Footer, Header } from "../../Components/index.js";
import Loader from "../../Components/Loader/Loader.jsx";
import {
  COMPLIANCE_STEPS,
  LOAN_SIM_STEPS,
  OTP_CONFIG,
  REJECTION_CONFIG,
} from "../../constants/LOAN_SIM.js";
import { HeroLoanSim } from "../../Sections/index.js";

// Lazy load de los pasos del simulador
const SimulationStep = lazy(() => import("./components/SimulationStep/SimulationStep"));
const EmailValidation = lazy(() => import("./components/EmailValidation/EmailValidation"));
const OTPValidation = lazy(() => import("../../Components/OTPValidation/OTPValidation.jsx"));
const ComplianceStep = lazy(() => import("./components/ComplianceStep/ComplianceStep"));
const CBUValidation = lazy(() => import("./components/CBUValidation/CBUValidation"));
const PendingCbuValidation = lazy(
  () => import("./components/PendingCbuValidation/PendingCbuValidation"),
);
const SuccessStep = lazy(() => import("./components/SuccessStep/SuccessStep"));
const MobbexSubscriptionStep = lazy(
  () => import("./components/MobbexSubscriptionStep/MobbexSubscriptionStep"),
);
const RejectedStep = lazy(() => import("./components/RejectedStep/RejectedStep"));
import { useLoanSimulator } from "./hooks/useLoanSimulator";
import { useComplianceForm } from "./hooks/useComplianceForm";
import { usePendingCbuValidation } from "./hooks/usePendingCbuValidation";
import { useTestSimuladorPanel } from "./hooks/useTestSimuladorPanel";
import TestSimuladorPanel from "./components/TestSimuladorPanel/TestSimuladorPanel.jsx";
import styles from "./LoanSimScreen.module.css";

const LoanSimScreen = () => {
  const testPanel = useTestSimuladorPanel();
  
  const {
    amount,
    installment,
    simulationData,
    cbuValidado,
    loading,
    validating,
    error,
    nombreCompleto,
    scoringId,
    step,
    email,
    cuit,
    loanInfo,
    loadingModal,
    bancoEncontrado,
    codigoBancoError,
    validandoBanco,
    initialSimulationResolved,
    rejectionReason,
    handleAmountChange,
    handleInstallmentChange,
    solicitarOTP,
    verificarOTP,
    validarCBU,
    handleNextStep,
    handlePrevStep,
    handleMobbexSubscriptionCompleted,
    handleInfoPrestamo,
    guardarCompliance,
    existingCompliance,
    verificarComplianceExistente,
    setStep,
    // Plan 2026-10-20: re-consulta el estado de la simulación para el botón
    // "Verificar estado" de la pantalla PENDING_CBU_VALIDATION. Sin esta
    // prop, el click revienta con `onVerificarEstado is not a function`.
    verificarEstadoCBU,
    cbuPendingStatus,
  } = useLoanSimulator();

  // Plan 2026-10-20: el step PENDING_CBU_VALIDATION delega la apertura del
  // chat de Callbell a este hook. El "verificar estado" NO vive acá: el
  // routing (PENDING → sigue, RECHAZADO → pantalla de rechazo,
  // CBU_VALIDATION → sigue el flujo) lo hace `verificarEstadoCBU`, que es el
  // que tiene `setStep` y el refresh de la simulación.
  const { handleContactAdvisor } = usePendingCbuValidation();

  // Bloquear render hasta que la primera respuesta de calcularPlanes sea
  // procesada. Antes se usaba `!scoringId && step === SIMULACION`, lo que
  // permitía que el step SIMULACION quedara visible (con los sliders de
  // capital/cuota) durante la ventana entre setScoringData y la respuesta
  // con existingSimulation.estado real del servidor — bug observable
  // cuando el usuario recarga en cualquier step (OTP, COMPLIANCE, CBU,
  // MOBBEX, COMPLETADO) o vuelve de Mobbex. El nuevo flag se setea en el
  // finally de fetchSimulation, así que cubre éxito y error.
  const isInitializing = !initialSimulationResolved;

  const shouldHideCallbell = isInitializing;

  useEffect(() => {
    if (shouldHideCallbell) {
      toggleCallbellWebchat(false);
    } else {
      toggleCallbellWebchat(true);
    }

    return () => {
      toggleCallbellWebchat(true);
    };
  }, [shouldHideCallbell]);

  useEffect(() => {
    if (step === LOAN_SIM_STEPS.COMPLIANCE) {
      verificarComplianceExistente();
    }
  }, [step]);

  useEffect(() => {
    if (step === LOAN_SIM_STEPS.COMPLIANCE && existingCompliance) {
      const createdDate = new Date(existingCompliance.created_at);
      const now = new Date();
      const diffInMs = now - createdDate;
      const diffInHours = diffInMs / (1000 * 60 * 60);
      if (diffInHours < 24) {
        setStep(LOAN_SIM_STEPS.CBU_VALIDATION);
      }
    }
  }, [step, existingCompliance, setStep]);

  const initialComplianceStep =
    existingCompliance !== undefined
      ? existingCompliance?.es_so || existingCompliance?.es_pep
        ? COMPLIANCE_STEPS.STATUS_CHECK
        : COMPLIANCE_STEPS.INITIAL
      : null;

  const complianceForm = useComplianceForm(
    guardarCompliance,
    initialComplianceStep,
    existingCompliance,
    cuit,
  );


  const renderStep = () => {
    return (
      <Suspense
        fallback={
          <div className={styles.loaderContainer}>
            <Loader />
          </div>
        }
      >
        {step === LOAN_SIM_STEPS.SIMULACION && (
          <SimulationStep
            amount={amount}
            installment={installment}
            simulationData={simulationData}
            loading={loading}
            nombreCompleto={nombreCompleto}
            onAmountChange={handleAmountChange}
            onInstallmentChange={handleInstallmentChange}
            onNextStep={handleNextStep}
            error={error}
          />
        )}
        {step === LOAN_SIM_STEPS.EMAIL_VALIDATION && (
          <EmailValidation
            onValidate={solicitarOTP}
            onBack={handlePrevStep}
            loading={validating}
            error={error}
          />
        )}
        {step === LOAN_SIM_STEPS.OTP_VALIDATION && (
          <OTPValidation
            onValidate={verificarOTP}
            onResend={solicitarOTP}
            onBack={handlePrevStep}
            loading={validating}
            error={error}
            destination={email}
            destinationType={OTP_CONFIG.DESTINATION_TYPE.EMAIL}
          />
        )}
        {step === LOAN_SIM_STEPS.COMPLIANCE &&
          (initialComplianceStep === null ? (
            <div className={styles.calculatorContainer}>
              <div className={styles.loaderContainer}>
                <Loader />
              </div>
            </div>
          ) : (
            <ComplianceStep
              scoringId={scoringId}
              onValidate={guardarCompliance}
              onBack={handlePrevStep}
              loading={validating}
              complianceForm={complianceForm}
              error={error}
            />
          ))}
        {step === LOAN_SIM_STEPS.CBU_VALIDATION && (
          <CBUValidation
            onValidate={validarCBU}
            loading={validating}
            error={error}
            onBack={handlePrevStep}
            isClient={!!simulationData?.existingSimulation?.id_cliente}
            existingCbu={simulationData?.existingSimulation?.cbu}
            // ⚠️ El valor y el tipo tienen que derivarse de la MISMA fuente.
            // El back escribe SOLO la columna del accountType del submit y nunca
            // limpia la otra → si el cliente cambió de CBU a CVU (o al revés),
            // quedan AMBAS pobladas. Con `pendingCbu = cbu_usuario || cvu_usuario`
            // y `pendingAccountType = cvu_usuario ? "cvu" : "cbu"` se emparejaría
            // el CBU viejo con el tipo "cvu" → el back escribiría un CBU en
            // `cvu_usuario` (exactamente la corrupción que la feature evita).
            pendingCbu={
              simulationData?.existingSimulation?.cbu_usuario ||
              simulationData?.existingSimulation?.cvu_usuario ||
              null
            }
            pendingAccountType={
              simulationData?.existingSimulation?.cbu_usuario ? "cbu" : "cvu"
            }
            cbuValidado={cbuValidado}
            bancoEncontrado={bancoEncontrado}
            codigoBancoError={codigoBancoError}
            validandoBanco={validandoBanco}
          />
        )}
        {step === LOAN_SIM_STEPS.PENDING_CBU_VALIDATION && (
          <PendingCbuValidation
            onContactAdvisor={handleContactAdvisor}
            onVerificarEstado={verificarEstadoCBU}
            status={cbuPendingStatus}
            // `verificarEstadoCBU` refresca la simulación y ese refresh setea
            // `loading` (no `validating`) → con `validating` solo, el spinner
            // del botón "Verificar estado" nunca giraba.
            loading={loading || validating}
            // Esta pantalla es un dead-end: la única superficie de error del
            // screen (`error && !simulationData && step === SIMULACION`) no
            // puede dispararse en este step → sin esta prop, un refresh
            // fallido (ej. `SIMULADOR_SIMULATION_EXPIRED` a las 24h) sería
            // totalmente mudo.
            error={error}
          />
        )}
        {step === LOAN_SIM_STEPS.MOBBEX_SUBSCRIPTION && (
          <MobbexSubscriptionStep
            scoringId={scoringId}
            onSubscriptionCompleted={handleMobbexSubscriptionCompleted}
            error={error}
          />
        )}
        {step === LOAN_SIM_STEPS.COMPLETADO && (
          <SuccessStep
            handleInfoPrestamo={handleInfoPrestamo}
            loanInfo={loanInfo}
            loadingModal={loadingModal}
            simulationData={simulationData}
          />
        )}
        {step === LOAN_SIM_STEPS.RECHAZADO && (
          <RejectedStep
            rejection={
              rejectionReason === "CBU_REJECTED"
                ? REJECTION_CONFIG.CBU_REJECTED
                : rejectionReason === "PHONE_NOT_VALIDATED"
                  ? REJECTION_CONFIG.PHONE_NOT_VALIDATED
                  : REJECTION_CONFIG.SIM_RECHAZADO
            }
          />
        )}
        {step === LOAN_SIM_STEPS.DISPOSITIVO_RECHAZADO && (
          <RejectedStep rejection={REJECTION_CONFIG.DEVICE_MISMATCH} />
        )}
      </Suspense>
    );
  };

  const renderBackButton = () => {
    if (step === LOAN_SIM_STEPS.CBU_VALIDATION && cbuValidado) return null;

    if (
      step !== LOAN_SIM_STEPS.COMPLIANCE &&
      step !== LOAN_SIM_STEPS.SIMULACION &&
      step !== LOAN_SIM_STEPS.COMPLETADO &&
      step !== LOAN_SIM_STEPS.RECHAZADO &&
      step !== LOAN_SIM_STEPS.DISPOSITIVO_RECHAZADO &&
      step !== LOAN_SIM_STEPS.MOBBEX_SUBSCRIPTION &&
      // Plan 2026-10-20: mientras un asesor revisa el CBU/CVU, "atrás" es un
      // callejón sin salida (el back no puede volver del step estacionado).
      step !== LOAN_SIM_STEPS.PENDING_CBU_VALIDATION
    )
      return <BackButton onClick={handlePrevStep} />;
    return null;
  };

  if (error && !simulationData && step === LOAN_SIM_STEPS.SIMULACION) {
    return (
      <div className={styles.errorScreenBox}>
        <div className={styles.calculatorContainer}>
          <h2 className={styles.title}>Simulador de Préstamo</h2>
          <div className={styles.errorContainer}>
            <p className={styles.errorMsg}>{error}</p>
            <p className={styles.errorSubtext}>Por favor, ponte en contacto con un operador.</p>
            <GenericButton
              type='button'
              variant='primary'
              onClick={() =>
                window.open(
                  "https://wa.me/5491137570853?text=Hola!!%20Necesito%20ayuda%20para%20simular%20mi%20pr%C3%A9stamo!",
                  "_blank",
                  "noopener,noreferrer",
                )
              }
              style={{ marginTop: "1rem" }}
            >
              Comunicarse con un asesor
            </GenericButton>
          </div>
        </div>
      </div>
    );
  }

  // Loading screen completo mientras se inicializa (consumeLink + fetchSimulation)
  if (isInitializing) {
    return (
      <>
        <Header />
        <div className={styles.homeCalculator_calculatorBox}>
          <div className={styles.calculatorContainer}>
            <div className={styles.loaderContainer}>
              <Loader />
              <p className={styles.loadingText}>Preparando tu simulación...</p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      {testPanel.personas.length > 0 && (
        <TestSimuladorPanel
          personas={testPanel.personas}
          loading={testPanel.loading}
          onSelectPersona={testPanel.selectPersona}
          onReset={testPanel.resetSession}
          onAprobarCbu={testPanel.aprobarCbu}
          approvingCbu={testPanel.approvingCbu}
          cbuAprobadoPara={testPanel.cbuAprobadoPara}
        />
      )}
      <Header />
      <main id='main-content'>
        <div className={styles.splitLayout}>
          <div className={styles.leftColumn}>
            <HeroLoanSim showCanalesOficiales={true} />
          </div>
          <div className={`${styles.homeCalculator_calculatorBox} ${styles.rightColumn}`}>
            <div
              className={`${styles.calculatorContainer} ${loading || validating ? styles.loadingOverlay : ""}`}
            >
              {renderBackButton()}
              {renderStep()}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default LoanSimScreen;
