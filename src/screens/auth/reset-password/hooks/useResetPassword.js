import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import authService from "../../../../services/authService.js";
import { useAuth } from "../../../../context/index.js";
import { useTurnstile } from "../../useTurnstile.js";
import { useAsyncSubmit } from "../../useAsyncSubmit.js";
import { writeAuthFlash } from "../../authFlash.js";

export const RESET_TOKEN_RE = /^[A-Za-z0-9_-]{10,128}$/;

export const RESET_LAYOUT = {
  title: "Actualizá tu acceso",
  sub: "Elegí una contraseña segura. Al confirmarla, cerraremos todas las sesiones activas.",
  image: "/img/security-identity-verification.webp",
};

export function useResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { logout } = useAuth();
  const token = searchParams.get("token") ?? "";
  const tokenValid = RESET_TOKEN_RE.test(token);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const turnstile = useTurnstile();

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "referrer";
    meta.content = "no-referrer";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const { loading, error, setError, run } = useAsyncSubmit({
    submit: () => authService.resetPassword(token, newPassword, turnstile.token),
  });

  const handleSubmit = async () => {
    if (honeypot) return;
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!turnstile.token) {
      setError("Completá la verificación de seguridad.");
      return;
    }
    try {
      await run();
      await logout();
      writeAuthFlash("¡Contraseña actualizada! Ya podés ingresar con la nueva contraseña.");
      navigate("/ingresar", { replace: true });
    } catch {
      turnstile.reset();
    }
  };

  return {
    tokenValid,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    honeypot,
    setHoneypot,
    turnstile,
    loading,
    error,
    handleSubmit,
  };
}
