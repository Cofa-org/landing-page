import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/index.js";
import { useTurnstile } from "../../useTurnstile.js";
import { consumeAuthFlash } from "../../authFlash.js";
import { AUTH_CAPTCHA_MODE, AUTH_TURNSTILE_INVALID_CAUSE } from "../../../../constants/AUTH.js";

const CAPTCHA_MODES = Object.values(AUTH_CAPTCHA_MODE);

const normalizeEmail = (value) => value.trim().toLowerCase();

export function useLoginFlow() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // El back elige el secreto de Turnstile por email e IP: el modo solo vale para el email que lo recibió.
  const [captchaSignal, setCaptchaSignal] = useState(null);
  const [successMessage] = useState(
    () => location.state?.successMessage || consumeAuthFlash(),
  );

  const turnstile = useTurnstile();
  const { onClear: clearTurnstileToken } = turnstile;

  const captchaMode =
    captchaSignal && captchaSignal.email === normalizeEmail(email)
      ? captchaSignal.mode
      : AUTH_CAPTCHA_MODE.INVISIBLE;

  // Un token emitido por un widget no lo valida el secreto del otro.
  const previousCaptchaMode = useRef(captchaMode);
  useEffect(() => {
    if (previousCaptchaMode.current === captchaMode) return;
    previousCaptchaMode.current = captchaMode;
    clearTurnstileToken();
  }, [captchaMode, clearTurnstileToken]);

  const handleSubmit = async () => {
    if (honeypot) return;
    if (!turnstile.token) {
      setError("Completá la verificación de seguridad.");
      return;
    }
    const submittedEmail = normalizeEmail(email);
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password, turnstile.token);
      navigate("/mi-perfil", { replace: true });
    } catch (err) {
      if (CAPTCHA_MODES.includes(err.data?.captchaMode)) {
        setCaptchaSignal({ email: submittedEmail, mode: err.data.captchaMode });
      } else if (
        err.cause === AUTH_TURNSTILE_INVALID_CAUSE &&
        captchaMode === AUTH_CAPTCHA_MODE.MANAGED
      ) {
        // Si el back seguía exigiendo managed, lo vuelve a indicar en el próximo intento sin sumar fallo.
        setCaptchaSignal({ email: submittedEmail, mode: AUTH_CAPTCHA_MODE.INVISIBLE });
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
