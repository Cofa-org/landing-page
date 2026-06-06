import React, { Suspense, memo } from "react";
import BackButton from "../../Components/buttons/backbutton/BackButton.jsx";
import { Footer, Header } from "../../Components/index.js";
import Loader from "../../Components/Loader/Loader.jsx";
import { HeroLoanSim } from "../../Sections/index.js";
import { LOAN_SIM_STEPS } from "../../constants/LOAN_SIM.js";
import { useOnboardingFlow } from "./hooks/useOnboardingFlow.js";
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
  } = useOnboardingFlow();

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
