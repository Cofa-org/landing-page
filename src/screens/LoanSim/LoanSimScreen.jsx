import { useEffect } from "react";
import BackButton from "../../Components/buttons/backbutton/Backbutton.jsx";
import { Footer, Header } from "../../Components/index.js";
import Loader from "../../Components/Loader/Loader.jsx";
import { COMPLIANCE_STEPS, LOAN_SIM_STEPS } from "../../constants/LOAN_SIM.js";
import { HeroLoanSim } from "../../Sections/index.js";
import CBUValidation from "./components/CBUValidation/CBUValidation";
import ComplianceStep from "./components/ComplianceStep/ComplianceStep";
import EmailValidation from "./components/EmailValidation/EmailValidation";
import OTPValidation from "./components/OTPValidation/OTPValidation";
import SimulationStep from "./components/SimulationStep/SimulationStep";
import SuccessStep from "./components/SuccessStep/SuccessStep";
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

  const maxOffer = simulationData?.capital_maximo_a_ofrecer
    ? Number(simulationData.capital_maximo_a_ofrecer)
    : 0;
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
            error={error}
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
        if (initialComplianceStep === null) {
          return (
            <div className={styles.calculatorContainer}>
              <div className={styles.loaderContainer}>
                <Loader />
              </div>
            </div>
          );
        }
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
            isClient={!!simulationData?.existingSimulation?.id_cliente}
            existingCbu={simulationData?.existingSimulation?.cbu}
            bancoEncontrado={bancoEncontrado}
            codigoBancoError={codigoBancoError}
            validandoBanco={validandoBanco}
          />
        );

      case LOAN_SIM_STEPS.COMPLETADO:
        return (
          <SuccessStep
            handleInfoPrestamo={handleInfoPrestamo}
            loanInfo={loanInfo}
            loadingModal={loadingModal}
            simulationData={simulationData}
          />
        );

      default:
        return null;
    }
  };

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
