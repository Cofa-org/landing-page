import { useForgotPassword } from "./hooks/useForgotPassword.js";
import ForgotPasswordForm from "./components/ForgotPasswordForm.jsx";
import ForgotPasswordSent from "./components/ForgotPasswordSent.jsx";

const ForgotPasswordScreen = () => {
  const flow = useForgotPassword();

  if (flow.sent) {
    return <ForgotPasswordSent />;
  }

  return (
    <ForgotPasswordForm
      email={flow.email}
      setEmail={flow.setEmail}
      honeypot={flow.honeypot}
      setHoneypot={flow.setHoneypot}
      turnstile={flow.turnstile}
      loading={flow.loading}
      error={flow.error}
      onSubmit={flow.handleSubmit}
    />
  );
};

export default ForgotPasswordScreen;
