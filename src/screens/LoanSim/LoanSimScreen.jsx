import { useEffect, lazy, Suspense } from "react";
import BackButton from "../../Components/buttons/backbutton/BackButton.jsx";
import { Footer, Header } from "../../Components/index.js";
import Loader from "../../Components/Loader/Loader.jsx";
import { COMPLIANCE_STEPS, LOAN_SIM_STEPS } from "../../constants/LOAN_SIM.js";
import { HeroLoanSim } from "../../Sections/index.js";

// Lazy load de los pasos del simulador
const SimulationStep = lazy(() => import("./components/SimulationStep/SimulationStep"));
const EmailValidation = lazy(() => import("./components/EmailValidation/EmailValidation"));
const OTPValidation = lazy(() => import("./components/OTPValidation/OTPValidation"));
const ComplianceStep = lazy(() => import("./components/ComplianceStep/ComplianceStep"));
const CBUValidation = lazy(() => import("./components/CBUValidation/CBUValidation"));
const SuccessStep = lazy(() => import("./components/SuccessStep/SuccessStep"));
import { useComplianceForm } from "./hooks/useComplianceForm.js";
import { useLoanSimulator } from "./hooks/useLoanSimulator";
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
    handleAmountChange,
    handleInstallmentChange,
    solicitarOTP,
    verificarOTP,
    validarCBU,
    handleNextStep,
    handlePrevStep,
    handleInfoPrestamo,
    guardarCompliance,
    existingCompliance,
    verificarComplianceExistente,
    setStep,
  } = useLoanSimulator();

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
      <Suspense fallback={<div className={styles.loaderContainer}><Loader /></div>}>
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
            email={email}
          />
        )}
        {step === LOAN_SIM_STEPS.COMPLIANCE && (
          initialComplianceStep === null ? (
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
          )
        )}
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
        {step === LOAN_SIM_STEPS.COMPLETADO && (
          <SuccessStep
            handleInfoPrestamo={handleInfoPrestamo}
            loanInfo={loanInfo}
            loadingModal={loadingModal}
            simulationData={simulationData}
          />
        )}
      </Suspense>
    );
  }

  const renderBackButton = () => {
    if (
      step !== LOAN_SIM_STEPS.COMPLIANCE &&
      step !== LOAN_SIM_STEPS.SIMULACION &&
      step !== LOAN_SIM_STEPS.COMPLETADO
    )
      return <BackButton onClick={handlePrevStep} />;
    return null;
  };

  if (error && !simulationData && step === LOAN_SIM_STEPS.SIMULACION) {
    return (
      <div className={styles.homeCalculator_calculatorBox}>
        <div className={styles.calculatorContainer}>
          <h2 className={styles.title}>Simulador de Préstamo</h2>
          <div className={styles.errorContainer}>
            <p className={styles.errorMsg}>{error}</p>
            <p className={styles.errorSubtext}>
              Por favor, ponte en contacto con un operador.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <HeroLoanSim />
      <div className={styles.homeCalculator_calculatorBox}>
        <div
          className={`${styles.calculatorContainer} ${loading || validating ? styles.loadingOverlay : ""}`}
        >
          {renderBackButton()}
          {renderStep()}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default LoanSimScreen;
