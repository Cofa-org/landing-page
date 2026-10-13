import { useResetPassword } from "./hooks/useResetPassword.js";
import ResetPasswordForm from "./components/ResetPasswordForm.jsx";
import ResetPasswordInvalid from "./components/ResetPasswordInvalid.jsx";

const ResetPasswordScreen = () => {
  const flow = useResetPassword();

  if (!flow.tokenValid) {
    return <ResetPasswordInvalid />;
  }

  return (
    <ResetPasswordForm
      newPassword={flow.newPassword}
      setNewPassword={flow.setNewPassword}
      confirmPassword={flow.confirmPassword}
      setConfirmPassword={flow.setConfirmPassword}
      honeypot={flow.honeypot}
      setHoneypot={flow.setHoneypot}
      turnstile={flow.turnstile}
      loading={flow.loading}
      error={flow.error}
      onSubmit={flow.handleSubmit}
    />
  );
};

export default ResetPasswordScreen;
