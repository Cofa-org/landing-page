import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/index.js";
import { useTurnstile } from "../../useTurnstile.js";
import { consumeAuthFlash } from "../../authFlash.js";
import { AUTH_CAPTCHA_MODE } from "../../../../constants/AUTH.js";

export function useLoginFlow() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [captchaMode, setCaptchaMode] = useState(AUTH_CAPTCHA_MODE.INVISIBLE);
  const [successMessage] = useState(
    () => location.state?.successMessage || consumeAuthFlash(),
  );

  const turnstile = useTurnstile();

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
      if (err.data?.captchaMode === AUTH_CAPTCHA_MODE.MANAGED) {
        setCaptchaMode(AUTH_CAPTCHA_MODE.MANAGED);
      }
      setError(err.message || "No pudimos iniciar sesión. Revisá los datos e intentá de nuevo.");
      turnstile.reset();
    } finally {
      setLoading(false);
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
    captchaMode,
    successMessage,
    turnstile,
    locationState: location.state,
    handleSubmit,
  };
}
