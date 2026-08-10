import React, { Suspense, memo, useCallback, useState } from "react";
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
const IdentitySelectionStep = React.lazy(
  () => import("./components/IdentitySelectionStep/IdentitySelectionStep.jsx"),
);

const OnboardingFlowScreen = () => {
  const {
    onboardingStep,
    navigateToNext,
    navigateToPrev,
    handleLeadSuccess,
    handleRejected,
    handleAnalysis,
    goToAnalysis,
    handleIdentitySelected,
    pendingIdentities,
    getLeadId,
    shouldShowBackButton,
    leadData,
    leadToken,
  } = useOnboardingFlow();

  const { verificarOTP, reenviarOTP, validating, error } = usePhoneOTP(getLeadId);

  const handlePrevStep = navigateToPrev;

  const [identitySelectionError, setIdentitySelectionError] = useState(null);
  const [identitySelectionLoading, setIdentitySelectionLoading] = useState(false);

  const handleIdentitySelect = useCallback(
    async (cuit) => {
      setIdentitySelectionError(null);
      setIdentitySelectionLoading(true);
      try {
        const result = await handleIdentitySelected(cuit);
        if (!result?.success) {
          setIdentitySelectionError(
            result?.error || "No pudimos procesar tu selección. Volvé a intentarlo.",
          );
        }
      } catch (err) {
        setIdentitySelectionError(err.message || "No pudimos procesar tu selección. Volvé a intentarlo.");
      } finally {
        setIdentitySelectionLoading(false);
      }
    },
    [handleIdentitySelected],
  );

  const handleVerificarOTP = useCallback(
    async (codigo) => {
      const result = await verificarOTP(codigo);
      if (!result?.success) return;

      const nuevoEstado = result.data?.estado_onboarding;

      if (nuevoEstado === ONBOARDING_STATES.RECHAZADO) {
        handleRejected();
      } else {
        // CELULAR_VALIDADO or DNI_SUBIDO — proceed to DNI_UPLOAD or RECIBO_UPLOAD.
        // Los leads que requieren análisis llegan aquí también; la transición a EN_ANALISIS
        // se hace al subir el recibo (subirRecibo en el back).
        navigateToNext(onboardingStep, {
          esCliente: result.data?.es_cliente ?? leadData?.es_cliente,
        });
      }
    },
    [verificarOTP, onboardingStep, leadData, handleRejected, navigateToNext],
  );

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
            onAnalysisAfterRecibo={goToAnalysis}
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
      case LOAN_SIM_STEPS.IDENTITY_SELECTION:
        return (
          <IdentitySelectionStep
            identities={pendingIdentities || []}
            onSelect={handleIdentitySelect}
            onBack={navigateToPrev}
            loading={identitySelectionLoading}
            error={identitySelectionError}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Header hideHelpButton={onboardingStep === LOAN_SIM_STEPS.LEAD_REGISTRATION} />
      <main id='main-content'>
        <div className={styles.splitLayout}>
          <div className={styles.leftColumn}>
            <HeroLoanSim />
          </div>
          <div className={`${styles.homeCalculator_calculatorBox} ${styles.rightColumn}`}>
            <div className={styles.calculatorContainer}>
              {shouldShowBackButton() && (
                <BackButton
                  onClick={navigateToPrev}
                  style={{
                    width: "100%",
                    marginBottom: "1rem",
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
        </div>
      </main>
      <Footer />
    </>
  );
};

export default memo(OnboardingFlowScreen);
