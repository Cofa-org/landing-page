import { useLoanSimulator } from "./hooks/useLoanSimulator";
import styles from "./LoanSimScreen.module.css";
import SimulationStep from "./components/SimulationStep/SimulationStep";
import EmailValidation from "./components/EmailValidation/EmailValidation";
import CBUValidation from "./components/CBUValidation/CBUValidation";
import OTPValidation from "./components/OTPValidation/OTPValidation";
import ComplianceStep from "./components/ComplianceStep/ComplianceStep";
import SuccessStep from "./components/SuccessStep/SuccessStep";
import { COMPLIANCE_STEPS, LOAN_SIM_STEPS } from "../../constants/LOAN_SIM.js";
import { Header, Footer } from "../../Components/index.js";
import { HeroLoanSim } from "../../Sections/index.js";
import BackButton from "../../Components/buttons/backbutton/Backbutton.jsx";
import { useState, useEffect } from "react";
import { useComplianceForm } from "./hooks/useComplianceForm.js";

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
    loanInfo,
    loadingModal,
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

  const [currentStepCompliance, setCurrentStepCompliance] = useState(null);

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
    existingCompliance?.es_so || existingCompliance?.es_pep
      ? COMPLIANCE_STEPS.STATUS_CHECK
      : COMPLIANCE_STEPS.INITIAL;

  const complianceForm = useComplianceForm(
    guardarCompliance,
    initialComplianceStep,
    existingCompliance,
  );

  const maxOffer = simulationData?.capital_maximo_a_ofrecer
    ? Number(simulationData.capital_maximo_a_ofrecer)
    : 200000;
  const installments = simulationData?.planes_disponibles?.map((p) => p.plazo) || [];
  const selectedPlan = simulationData?.planes_disponibles?.find((p) => p.plazo === installment);

  const renderStep = () => {
    switch (step) {
      case LOAN_SIM_STEPS.SIMULACION:
        return (
          <SimulationStep
            amount={amount}
            installment={installment}
            maxOffer={maxOffer}
            installments={installments}
            simulationData={simulationData}
            selectedPlan={selectedPlan}
            loading={loading}
            nombreCompleto={nombreCompleto}
            onAmountChange={handleAmountChange}
            onInstallmentChange={handleInstallmentChange}
            onNextStep={handleNextStep}
          />
        );

      case LOAN_SIM_STEPS.EMAIL_VALIDATION:
        return (
          <EmailValidation
            onValidate={solicitarOTP}
            onBack={handlePrevStep}
            loading={validating}
            error={error}
          />
        );

      case LOAN_SIM_STEPS.OTP_VALIDATION:
        return (
          <OTPValidation
            onValidate={verificarOTP}
            onResend={solicitarOTP}
            onBack={handlePrevStep}
            loading={validating}
            error={error}
            email={email}
          />
        );

      case LOAN_SIM_STEPS.COMPLIANCE:
        return (
          <ComplianceStep
            scoringId={scoringId}
            onValidate={guardarCompliance}
            onBack={handlePrevStep}
            loading={validating}
            complianceForm={complianceForm}
            error={error}
          />
        );

      case LOAN_SIM_STEPS.CBU_VALIDATION:
        return (
          <CBUValidation
            onValidate={validarCBU}
            loading={validating}
            error={error}
            onBack={handlePrevStep}
          />
        );

      case LOAN_SIM_STEPS.COMPLETADO:
        return (
          <SuccessStep
            handleInfoPrestamo={handleInfoPrestamo}
            loanInfo={loanInfo}
            loadingModal={loadingModal}
          />
        );

      default:
        return null;
    }
  };

  const renderBackButton = () => {
    if (step === LOAN_SIM_STEPS.COMPLIANCE && currentStepCompliance === COMPLIANCE_STEPS.INITIAL)
      return <BackButton onClick={handlePrevStep} />;
    if (step !== LOAN_SIM_STEPS.COMPLIANCE && step !== LOAN_SIM_STEPS.SIMULACION)
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
              Por favor, utilizá el enlace que recibiste para acceder al simulador.
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
        <div className={`${styles.calculatorContainer} ${loading ? styles.loadingOverlay : ""}`}>
          {renderBackButton()}
          {renderStep()}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default LoanSimScreen;
