import { useRegisterFlow, STEP } from "./hooks/useRegisterFlow.js";
import RegisterDniStep from "./components/RegisterDniStep.jsx";
import RegisterIdentityStep from "./components/RegisterIdentityStep.jsx";
import RegisterNewStep from "./components/RegisterNewStep.jsx";
import RegisterExistingStep from "./components/RegisterExistingStep.jsx";
import RegisterAlreadyRegisteredStep from "./components/RegisterAlreadyRegisteredStep.jsx";
import RegisterVerifyStep from "./components/RegisterVerifyStep.jsx";

const RegisterScreen = () => {
  const flow = useRegisterFlow();

  if (flow.step === STEP.VERIFY) {
    return (
      <RegisterVerifyStep
        destination={flow.verifyDestination}
        onValidate={flow.handleVerify}
        onResend={flow.handleResend}
        onBack={flow.goBackFromVerify}
        loading={flow.loadingVerify}
        error={flow.errorVerify}
        turnstile={flow.turnstileVerify}
      />
    );
  }

  if (flow.step === STEP.ALREADY_REGISTERED) {
    return (
      <RegisterAlreadyRegisteredStep
        maskedEmail={flow.existingMaskedEmail}
        onLogin={flow.goToLogin}
        onBack={flow.goBackIdentityOrDni}
      />
    );
  }

  if (flow.step === STEP.EXISTING) {
    return (
      <RegisterExistingStep
        maskedEmail={flow.existingMaskedEmail}
        password={flow.passwordExisting}
        setPassword={flow.setPasswordExisting}
        honeypot={flow.honeypot}
        setHoneypot={flow.setHoneypot}
        turnstile={flow.turnstileExisting}
        loading={flow.loadingExisting}
        error={flow.errorExisting}
        onSubmit={flow.handleExistingClientRegister}
        onBack={flow.goBackIdentityOrDni}
      />
    );
  }

  if (flow.step === STEP.IDENTITY) {
    return (
      <RegisterIdentityStep
        identities={flow.identities}
        onSelect={flow.handleIdentitySelect}
        onBack={flow.goBackToDni}
      />
    );
  }

  if (flow.step === STEP.REGISTER) {
    return (
      <RegisterNewStep
        email={flow.email}
        setEmail={flow.setEmail}
        password={flow.password}
        setPassword={flow.setPassword}
        honeypot={flow.honeypot}
        setHoneypot={flow.setHoneypot}
        turnstile={flow.turnstileReg}
        loading={flow.loadingReg}
        error={flow.errorReg}
        onSubmit={flow.handleRegister}
        onBack={flow.goBackIdentityOrDni}
        locationState={flow.locationState}
      />
    );
  }

  return (
    <RegisterDniStep
      dni={flow.dni}
      setDni={flow.setDni}
      honeypot={flow.honeypot}
      setHoneypot={flow.setHoneypot}
      turnstile={flow.turnstileDni}
      loading={flow.loadingDni}
      error={flow.errorDni}
      onSubmit={flow.handleDniSubmit}
      locationState={flow.locationState}
    />
  );
};

export default RegisterScreen;
