import React from "react";
import { useLoanSimulator } from "./hooks/useLoanSimulator";
import styles from "./LoanSimScreen.module.css";

// Step Components
import SimulationStep from "./components/SimulationStep/SimulationStep";
import EmailValidation from "./components/EmailValidation/EmailValidation";
import CBUValidation from "./components/CBUValidation/CBUValidation";
import OTPValidation from "./components/OTPValidation/OTPValidation";
import SuccessStep from "./components/SuccessStep/SuccessStep";

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
    handleAmountChange,
    handleInstallmentChange,
    solicitarOTP,
    verificarOTP,
    validateCBU,
    handleNextStep,
  } = useLoanSimulator();

  const maxOffer = simulationData?.capital_maximo_a_ofrecer
    ? Number(simulationData.capital_maximo_a_ofrecer)
    : 200000;
  const installments = simulationData?.plazos_disponibles || [];

  const renderStep = () => {
    switch (step) {
      case "simulacion":
        return (
          <SimulationStep
            amount={amount}
            installment={installment}
            maxOffer={maxOffer}
            installments={installments}
            simulationData={simulationData}
            loading={loading}
            cuit={cuit}
            onAmountChange={handleAmountChange}
            onInstallmentChange={handleInstallmentChange}
            onNextStep={handleNextStep}
          />
        );

      case "email":
        return (
          <EmailValidation
            onValidate={solicitarOTP}
            loading={validating}
            error={error}
          />
        );

      case "otp":
        return (
          <OTPValidation
            onValidate={verificarOTP}
            loading={validating}
            error={error}
            email={email}
          />
        );

      case "cbu":
        return (
          <CBUValidation
            onValidate={validateCBU}
            loading={validating}
            error={error}
          />
        );

      case "success":
        return <SuccessStep />;

      default:
        return null;
    }
  };

  if (error && !simulationData && step === "simulacion") {
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
    <div className={styles.homeCalculator_calculatorBox}>
      <div className={`${styles.calculatorContainer} ${loading ? styles.loadingOverlay : ""}`}>
        {renderStep()}
      </div>
    </div>
  );
};

export default LoanSimScreen;
