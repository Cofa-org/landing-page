import { useLoginFlow } from "./hooks/useLoginFlow.js";
import LoginForm from "./components/LoginForm.jsx";

const LoginScreen = () => {
  const flow = useLoginFlow();

  return (
    <LoginForm
      email={flow.email}
      setEmail={flow.setEmail}
      password={flow.password}
      setPassword={flow.setPassword}
      honeypot={flow.honeypot}
      setHoneypot={flow.setHoneypot}
      turnstile={flow.turnstile}
      captchaMode={flow.captchaMode}
      loading={flow.loading}
      error={flow.error}
      successMessage={flow.successMessage}
      onSubmit={flow.handleSubmit}
      locationState={flow.locationState}
    />
  );
};

export default LoginScreen;
