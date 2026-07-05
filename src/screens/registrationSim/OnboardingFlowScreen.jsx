import React, { Suspense, memo, useCallback } from "react";
import BackButton from "../../Components/buttons/backbutton/BackButton.jsx";
import { Footer, Header } from "../../Components/index.js";
import Loader from "../../Components/Loader/Loader.jsx";
import { HeroLoanSim } from "../../Sections/index.js";
import { LOAN_SIM_STEPS, OTP_CONFIG, ONBOARDING_STATES } from "../../constants/LOAN_SIM.js";
import { useOnboardingFlow } from "./hooks/useOnboardingFlow.js";
import { usePhoneOTP } from "./hooks/usePhoneOTP.js";
import OTPValidation from "../../Components/OTPValidation/OTPValidation.jsx";
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
const AnalysisStep = React.lazy(() => import("./components/AnalysisStep/AnalysisStep.jsx"));

const OnboardingFlowScreen = () => {
  const {
    onboardingStep,
    navigateToNext,
    navigateToPrev,
    handleLeadSuccess,
    handleRejected,
    handleAnalysis,
    getLeadId,
    shouldShowBackButton,
    leadData,
    leadToken,
  } = useOnboardingFlow();

  const { verificarOTP, reenviarOTP, validating, error } = usePhoneOTP(getLeadId);

  const handlePrevStep = navigateToPrev;

  const handleVerificarOTP = useCallback(async (codigo) => {
      const result = await verificarOTP(codigo);
      if (!result?.success) return;

      const nuevoEstado = result.data?.estado_onboarding;

      if (nuevoEstado === ONBOARDING_STATES.EN_ANALISIS) {
        handleAnalysis({ lead: result.data, token: leadToken });
      } else if (nuevoEstado === ONBOARDING_STATES.RECHAZADO) {
        handleRejected();
      } else {
        // CELULAR_VALIDADO or DNI_SUBIDO — proceed to DNI_UPLOAD or RECIBO_UPLOAD
        navigateToNext(onboardingStep, {
          esCliente: result.data?.es_cliente ?? leadData?.es_cliente,
        });
      }
  }, [verificarOTP, onboardingStep, leadData, leadToken, handleAnalysis, handleRejected, navigateToNext]);

  const renderStep = () => {
    switch (onboardingStep) {
      case LOAN_SIM_STEPS.LEAD_REGISTRATION:
        return (
          <LeadRegistrationStep
            onSuccess={handleLeadSuccess}
            onRejected={handleRejected}
            onAnalysis={handleAnalysis}
            onNext={() => navigateToNext(LOAN_SIM_STEPS.LEAD_REGISTRATION)}
            error={null}
          />
        );
      case LOAN_SIM_STEPS.DNI_UPLOAD:
        return (
          <DNIUploadStep
            leadId={getLeadId()}
            leadToken={leadToken}
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
            destinationType={OTP_CONFIG.DESTINATION_TYPE.PHONE}
            onValidate={handleVerificarOTP}
            onResend={reenviarOTP}
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
      case LOAN_SIM_STEPS.EN_ANALISIS:
        return <AnalysisStep />;
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
