import React, { Suspense, memo, useCallback, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toggleCallbellWebchat } from "../../utils/callbellHelpers";
import BackButton from "../../Components/buttons/backbutton/BackButton.jsx";
import { Footer, Header } from "../../Components/index.js";
import Loader from "../../Components/Loader/Loader.jsx";
import { HeroLoanSim } from "../../Sections/index.js";
import { LOAN_SIM_STEPS, OTP_CONFIG, ONBOARDING_STATES, COOKIE_LEAD_TOKEN_CONFIG } from "../../constants/LOAN_SIM.js";
import { useOnboardingFlow } from "./hooks/useOnboardingFlow.js";
import { usePhoneOTP } from "./hooks/usePhoneOTP.js";
import { usePhonePicker } from "./hooks/usePhonePicker.js";
import OTPValidation from "../../Components/OTPValidation/OTPValidation.jsx";
import styles from "./OnboardingFlow.module.css";
import RejectedStep from "./components/RejectedStep/RejectedStep.jsx";
import LinkResolutionService from "../../services/linkResolutionService.js";
import LeadRegistrationService from "../../services/leadRegistrationService.js";
import { setCookie } from "../../lib/utils.js";

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
const PhonePickerStep = React.lazy(
  () => import("./components/PhonePickerStep/PhonePickerStep.jsx"),
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
    handlePickerTriggered,
    handlePickerPick: submitPickerPick,
    pendingIdentities,
    pickerContext,
    rejectedFechaExpiracionBloqueo,
    getLeadId,
    shouldShowBackButton,
    leadData,
    leadToken,
    setLeadData,
    setLeadToken,
    setOnboardingStep,
  } = useOnboardingFlow();

  const { verificarOTP, reenviarOTP, validating, error } = usePhoneOTP(getLeadId);
  const { submitPick, submitting: pickerLoading, error: pickerError } = usePhonePicker();

  const handlePrevStep = navigateToPrev;

  const [identitySelectionError, setIdentitySelectionError] = useState(null);
  const [identitySelectionLoading, setIdentitySelectionLoading] = useState(false);

  // Resume branch (spec "Recibo resubida operador" 2026-09-07):
  // El operador genera un shortId que el cliente abre como
  // `/?resume=<shortId>`. Consumimos el link, iniciamos la sesión,
  // sembramos el cookie + state de onboarding y saltamos directo a
  // RECIBO_UPLOAD (saltando PHONE_VALIDATION / DNI_UPLOAD).
  const [searchParams] = useSearchParams();
  const resumeShortId = searchParams.get("id");
  const [resumeMaxSlots, setResumeMaxSlots] = useState(3);
  const [resumeError, setResumeError] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);

  useEffect(() => {
    if (!resumeShortId) return undefined;
    let cancelled = false;
    setResumeLoading(true);
    setResumeError(null);
    (async () => {
      try {
        const consumed = await LinkResolutionService.consumeLink(resumeShortId);
        
        if (cancelled) return;
        if (!consumed?.success || !consumed.data?.leadId) {
          setResumeError("El enlace es inválido o ha expirado");
          return;
        }
        const init = await LeadRegistrationService.iniciarSesionResume({
          leadId: consumed.data.leadId,
          shortId: resumeShortId,
        });
        
        if (cancelled) return;
        if (!init?.success) {
          setResumeError(init?.message || "No pudimos iniciar la sesión");
          return;
        }
        await setCookie(
          COOKIE_LEAD_TOKEN_CONFIG.NAME,
          init.data.leadToken,
          COOKIE_LEAD_TOKEN_CONFIG.EXPIRY_MS,
        );
        if (cancelled) return;
        setLeadData({
          leadId: init.data.leadId,
          es_cliente: init.data.es_cliente,
          celular: init.data.celular,
        });
        setLeadToken(init.data.leadToken);
        setResumeMaxSlots(init.data.maxSlots ?? 3);
        setOnboardingStep(LOAN_SIM_STEPS.RECIBO_UPLOAD);
      } catch (e) {
        if (cancelled) return;
        console.error("RESUME_INIT_ERROR:", e);
        setResumeError("No pudimos procesar el enlace");
      } finally {
        if (!cancelled) setResumeLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resumeShortId, setLeadData, setLeadToken, setOnboardingStep]);

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
        setIdentitySelectionError(
          err.message || "No pudimos procesar tu selección. Volvé a intentarlo.",
        );
      } finally {
        setIdentitySelectionLoading(false);
      }
    },
    [handleIdentitySelected],
  );

  const handleVerificarOTP = useCallback(
    async (codigo) => {
      const result = await verificarOTP(codigo);

      // Phone picker trigger: el back devolvió el shape `requiresPhonePicker`
      // en lugar de `success: true`. Persistimos el contexto (options + target)
      // y navegamos al step PHONE_PICKER. La presentación queda en PhonePickerStep.
      if (result?.requiresPhonePicker) {
        handlePickerTriggered({
          options: result.options ?? [],
          target: result.target ?? null,
        });
        return;
      }

      if (!result?.success) return;

      const nuevoEstado = result.data?.estado_onboarding;

      if (nuevoEstado === ONBOARDING_STATES.RECHAZADO) {
        handleRejected();
      } else {
        // CELULAR_VALIDADO or DNI_SUBIDO — proceed to DNI_UPLOAD or RECIBO_UPLOAD.
        // Los leads que requieren análisis llegan aquí también; la transición a EN_ANALISIS
        // se hace al subir el recibo (subirRecibos en el back).
        navigateToNext(onboardingStep, {
          esCliente: result.data?.es_cliente ?? leadData?.es_cliente,
        });
      }
    },
    [verificarOTP, onboardingStep, leadData, handleRejected, navigateToNext, handlePickerTriggered],
  );

  const handlePickerPick = useCallback(
    async (opcionElegida) => {
      await submitPickerPick(submitPick, opcionElegida);
    },
    [submitPickerPick, submitPick],
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
            maxSlots={resumeMaxSlots}
            onSuccess={() => navigateToNext(LOAN_SIM_STEPS.RECIBO_UPLOAD)}
            onAnalysisAfterRecibo={goToAnalysis}
            error={resumeError}
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
        return (
          <RejectedStep />
        );
      case LOAN_SIM_STEPS.EN_ANALISIS:
        return <AnalysisStep onBack={navigateToPrev} />;
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
      case LOAN_SIM_STEPS.PHONE_PICKER:
        return (
          <PhonePickerStep
            options={pickerContext?.options ?? []}
            onPick={handlePickerPick}
            loading={pickerLoading}
            error={pickerError}
          />
        );
      default:
        return null;
    }
  };

  const isFirstOrLastStep =
    onboardingStep === LOAN_SIM_STEPS.LEAD_REGISTRATION ||
    onboardingStep === LOAN_SIM_STEPS.WELCOME ||
    onboardingStep === LOAN_SIM_STEPS.RECHAZADO;

  useEffect(() => {
    if (isFirstOrLastStep) {
      toggleCallbellWebchat(false);
    } else {
      toggleCallbellWebchat(true);
    }
    
    return () => {
      toggleCallbellWebchat(true);
    };
  }, [isFirstOrLastStep]);

  return (
    <>
      <Header 
        hideHelpButton={isFirstOrLastStep} 
        helpButtonPreset="Hola!! Quiero mi préstamo!!" 
      />
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
