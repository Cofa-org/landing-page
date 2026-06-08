import React, { Suspense, memo, useCallback, useState } from "react";
import BackButton from "../../Components/buttons/backbutton/BackButton.jsx";
import { Footer, Header } from "../../Components/index.js";
import Loader from "../../Components/Loader/Loader.jsx";
import { HeroLoanSim } from "../../Sections/index.js";
import { LOAN_SIM_STEPS } from "../../constants/LOAN_SIM.js";
import { useOnboardingFlow } from "./hooks/useOnboardingFlow.js";
import OTPValidation from "../../Components/OTPValidation/OTPValidation.jsx";
import LeadRegistrationService from "../../services/leadRegistrationService.js";
import styles from "./OnboardingFlow.module.css";
import RejectedStep from "./components/RejectedStep/RejectedStep.jsx";

const LeadRegistrationStep = React.lazy(
  () => import("./components/LeadRegistrationStep/LeadRegistrationStep.jsx"),
);
const DNIUploadStep = React.lazy(() => import("./components/DNIUploadStep/DNIUploadStep.jsx"));
const ReciboUploadStep = React.lazy(
  () => import("./components/ReciboUploadStep/ReciboUploadStep.jsx"),
);
const WelcomeStep = React.lazy(() => import("./components/WelcomeStep/WelcomeStep.jsx"));

const OnboardingFlowScreen = () => {
  const {
    onboardingStep,
    navigateToNext,
    navigateToPrev,
    handleLeadSuccess,
    handleRejected,
    getLeadId,
    shouldShowBackButton,
    leadData,
  } = useOnboardingFlow();
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState(null);

  const handleVerificarOTP = useCallback(async (codigo) => {
    const leadId = getLeadId();
    if (!leadId) return;
    setValidating(true);
    setError(null);
    try {
      const result = await LeadRegistrationService.verificarOTPCelular({ leadId, codigo });
      if (result.success) {
        navigateToNext(onboardingStep);
      }
    } catch (err) {
      setError(err.message || "Código incorrecto o expirado");
    } finally {
      setValidating(false);
    }
  }, [getLeadId, onboardingStep]);

  const handleReenviarOTP = useCallback(async (destination) => {
    const leadId = getLeadId();
    if (!leadId || !destination) return;
    setValidating(true);
    setError(null);
    try {
      await LeadRegistrationService.solicitarOTPCelular({ leadId, celular: destination });
    } catch (err) {
      setError(err.message || "Error al reenviar el código");
    } finally {
      setValidating(false);
    }
  }, [getLeadId]);

  const handlePrevStep = navigateToPrev;

  const renderStep = () => {
    switch (onboardingStep) {
      case LOAN_SIM_STEPS.LEAD_REGISTRATION:
        return (
          <LeadRegistrationStep
            onSuccess={handleLeadSuccess}
            onRejected={handleRejected}
            onNext={() => navigateToNext(LOAN_SIM_STEPS.LEAD_REGISTRATION)}
            error={null}
          />
        );
      case LOAN_SIM_STEPS.DNI_UPLOAD:
        return (
          <DNIUploadStep
            leadId={getLeadId()}
            onSuccess={() => navigateToNext(LOAN_SIM_STEPS.DNI_UPLOAD)}
            error={null}
          />
        );
      case LOAN_SIM_STEPS.RECIBO_UPLOAD:
        return (
          <ReciboUploadStep
            leadId={getLeadId()}
            onSuccess={() => navigateToNext(LOAN_SIM_STEPS.RECIBO_UPLOAD)}
            error={null}
          />
        );
      case LOAN_SIM_STEPS.PHONE_VALIDATION:
        return (
          <OTPValidation
            destination={leadData?.celular}
            destinationType="phone"
            onValidate={handleVerificarOTP}
            onResend={handleReenviarOTP}
            onBack={handlePrevStep}
            loading={validating}
            error={error}
          />
        );
      case LOAN_SIM_STEPS.WELCOME:
        return (
          <WelcomeStep
            leadId={getLeadId()}
            onBack={navigateToPrev}
          />
        );
      case LOAN_SIM_STEPS.RECHAZADO:
        return <RejectedStep />;
      default:
        return null;
    }
  };

  return (
    <>
      <Header />
      <main id='main-content'>
        <HeroLoanSim />
        <div className={styles.homeCalculator_calculatorBox}>
          <div className={styles.calculatorContainer}>
            {shouldShowBackButton() && (
              <BackButton
                onClick={navigateToPrev}
                style={{
                  width: "100%",
                  "marginBottom": "1rem",
                }}
              />
            )}
            <Suspense
              fallback={
                <div className={styles.loaderContainer}>
                  <Loader />
                </div>
              }
            >
              {renderStep()}
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default memo(OnboardingFlowScreen);
