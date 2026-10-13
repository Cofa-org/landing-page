import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/index.js";
import authService from "../../../../services/authService.js";
import { useTurnstile } from "../../useTurnstile.js";
import { consumeAuthFlash, writeAuthFlash } from "../../authFlash.js";

export function useLoginFlow() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsVerify, setNeedsVerify] = useState(false);
  const [successMessage] = useState(
    () => location.state?.successMessage || consumeAuthFlash(),
  );

  const turnstile = useTurnstile();
  const turnstileVerify = useTurnstile();

  const handleSubmit = async () => {
    if (honeypot) return;
    if (!turnstile.token) {
      setError("Completá la verificación de seguridad.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password, turnstile.token);
      navigate("/mi-perfil", { replace: true });
    } catch (err) {
      if (err.cause === "AUTH_EMAIL_NOT_VERIFIED") {
        setNeedsVerify(true);
        setError("");
        return;
      }
      setError(err.message || "No pudimos iniciar sesión. Revisá los datos e intentá de nuevo.");
      turnstile.reset();
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (code) => {
    if (!turnstileVerify.token) {
      setError("Completá la verificación de seguridad.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authService.verifyEmail(email.trim(), code, turnstileVerify.token);
      writeAuthFlash("¡Email confirmado! Ya podés ingresar.");
      navigate("/ingresar", { replace: true, state: { from: location.state?.from } });
    } catch (err) {
      setError(err.message || "El código es inválido o expiró. Pedí uno nuevo.");
      turnstileVerify.reset();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!turnstileVerify.token) {
      setError("Completá la verificación de seguridad.");
      return;
    }
    try {
      await authService.resendOtp(email.trim(), turnstileVerify.token);
    } catch {
      // genérico
    } finally {
      turnstileVerify.reset();
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    honeypot,
    setHoneypot,
    loading,
    error,
    needsVerify,
    successMessage,
    turnstile,
    turnstileVerify,
    locationState: location.state,
    handleSubmit,
    handleVerify,
    handleResend,
    goBackToForm: () => setNeedsVerify(false),
  };
}
