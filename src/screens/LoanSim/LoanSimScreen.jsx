import { useLoanSimulator } from "./hooks/useLoanSimulator";
import styles from "./LoanSimScreen.module.css";
import SimulationStep from "./components/SimulationStep/SimulationStep";
import EmailValidation from "./components/EmailValidation/EmailValidation";
import CBUValidation from "./components/CBUValidation/CBUValidation";
import OTPValidation from "./components/OTPValidation/OTPValidation";
import SuccessStep from "./components/SuccessStep/SuccessStep";
import { LOAN_SIM_STEPS } from "../../constants/LOAN_SIM.js";
import { Header, Footer } from "../../Components/index.js";
import { HeroLoanSim } from "../../Sections/index.js";

const LoanSimScreen = () => {
  const {
    amount,
    installment,
    simulationData,
    loading,
    validating,
    error,
    cuit,
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
  } = useLoanSimulator();

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
            cuit={cuit}
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
          {renderStep()}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default LoanSimScreen;
