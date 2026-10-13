import { useLoginFlow } from "./hooks/useLoginFlow.js";
import LoginForm from "./components/LoginForm.jsx";
import LoginVerifyStep from "./components/LoginVerifyStep.jsx";

const LoginScreen = () => {
  const flow = useLoginFlow();

  if (flow.needsVerify) {
    return (
      <LoginVerifyStep
        destination={flow.email.trim()}
        onValidate={flow.handleVerify}
        onResend={flow.handleResend}
        onBack={flow.goBackToForm}
        loading={flow.loading}
        error={flow.error}
        turnstile={flow.turnstileVerify}
      />
    );
  }

  return (
    <LoginForm
      email={flow.email}
      setEmail={flow.setEmail}
      password={flow.password}
      setPassword={flow.setPassword}
      honeypot={flow.honeypot}
      setHoneypot={flow.setHoneypot}
      turnstile={flow.turnstile}
      loading={flow.loading}
      error={flow.error}
      successMessage={flow.successMessage}
      onSubmit={flow.handleSubmit}
      locationState={flow.locationState}
    />
  );
};

export default LoginScreen;
