import { useEffect, lazy, Suspense } from "react";
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
const SuccessStep = lazy(() => import("./components/SuccessStep/SuccessStep"));
const MobbexSubscriptionStep = lazy(() =>
  import("./components/MobbexSubscriptionStep/MobbexSubscriptionStep"),
);
const RejectedStep = lazy(() =>
  import("./components/RejectedStep/RejectedStep"),
);
import { useLoanSimulator } from "./hooks/useLoanSimulator";
import { useComplianceForm } from "./hooks/useComplianceForm";
import styles from "./LoanSimScreen.module.css";

const LoanSimScreen = () => {
  const {
    amount,
    installment,
    simulationData,
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
  } = useLoanSimulator();

  // Bloquear render hasta que la primera respuesta de calcularPlanes sea
  // procesada. Antes se usaba `!scoringId && step === SIMULACION`, lo que
  // permitía que el step SIMULACION quedara visible (con los sliders de
  // capital/cuota) durante la ventana entre setScoringData y la respuesta
  // con existingSimulation.estado real del servidor — bug observable
  // cuando el usuario recarga en cualquier step (OTP, COMPLIANCE, CBU,
  // MOBBEX, COMPLETADO) o vuelve de Mobbex. El nuevo flag se setea en el
  // finally de fetchSimulation, así que cubre éxito y error.
  const isInitializing = !initialSimulationResolved;

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
            bancoEncontrado={bancoEncontrado}
            codigoBancoError={codigoBancoError}
            validandoBanco={validandoBanco}
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
              rejectionReason === "PHONE_NOT_VALIDATED"
                ? REJECTION_CONFIG.PHONE_NOT_VALIDATED
                : REJECTION_CONFIG.DEVICE_MISMATCH
            }
          />
        )}
        {step === LOAN_SIM_STEPS.DISPOSITIVO_RECHAZADO && <RejectedStep />}
      </Suspense>
    );
  };

  const renderBackButton = () => {
    if (
      step !== LOAN_SIM_STEPS.COMPLIANCE &&
      step !== LOAN_SIM_STEPS.SIMULACION &&
      step !== LOAN_SIM_STEPS.COMPLETADO &&
      step !== LOAN_SIM_STEPS.RECHAZADO &&
      step !== LOAN_SIM_STEPS.DISPOSITIVO_RECHAZADO &&
      step !== LOAN_SIM_STEPS.MOBBEX_SUBSCRIPTION
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
              onClick={() => (window.location.href = "http://wa.me/5491137570853?text=Hola!!%20Necesito%20ayuda%20para%20simular%20mi%20pr%C3%A9stamo!")}
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
        <Header hideHelpButton={true} />
        <div className={styles.homeCalculator_calculatorBox}>
          <div className={styles.calculatorContainer}>
            <div className={styles.loaderContainer}>
              <Loader />
              <p className={styles.loadingText}>Preparando tu simulación...</p>
            </div>
          </div>
        </div>
        <Footer hideWhatsAppBtn={true} />
      </>
    );
  }

  const isFirstOrLastStep = step === LOAN_SIM_STEPS.SIMULACION || step === LOAN_SIM_STEPS.COMPLETADO;

  return (
    <>
      <Header hideHelpButton={isFirstOrLastStep} />
      <main id='main-content'>
        <div className={styles.splitLayout}>
          <div className={styles.leftColumn}>
            <HeroLoanSim />
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
      <Footer hideWhatsAppBtn={isFirstOrLastStep} />
    </>
  );
};

export default LoanSimScreen;
