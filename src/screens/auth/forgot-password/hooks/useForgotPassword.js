import { useState } from "react";
import authService from "../../../../services/authService.js";
import { useTurnstile } from "../../useTurnstile.js";
import { useAsyncSubmit } from "../../useAsyncSubmit.js";

export function useForgotPassword() {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [sent, setSent] = useState(false);
  const turnstile = useTurnstile();

  const { loading, error, setError, run } = useAsyncSubmit({
    submit: () => authService.forgotPassword(email.trim(), turnstile.token),
  });

  const handleSubmit = async () => {
    if (honeypot) return;
    if (!turnstile.token) {
      setError("Completá la verificación de seguridad.");
      return;
    }
    try {
      await run();
      setSent(true);
    } catch {
      turnstile.reset();
    }
  };

  return {
    email,
    setEmail,
    honeypot,
    setHoneypot,
    sent,
    turnstile,
    loading,
    error,
    handleSubmit,
  };
}
