import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import GenericForm from "../../Components/Forms/GenericForm/GenericForm.jsx";
import PasswordInput from "../../Components/Forms/GenericInput/PasswordInput.jsx";
import GenericButton from "../../Components/buttons/GenericButton/GenericButton.jsx";
import Turnstile from "../../Components/Turnstile/Turnstile.jsx";
import authService from "../../services/authService.js";
import { useAuth } from "../../context/index.js";
import { TURNSTILE_SITE_KEY } from "../../config.js";
import HoneypotField from "./HoneypotField.jsx";
import AuthSplitLayout from "./AuthSplitLayout.jsx";
import { useTurnstile } from "./useTurnstile.js";
import { useAsyncSubmit } from "./useAsyncSubmit.js";
import { writeAuthFlash } from "./authFlash.js";
import styles from "./auth.module.css";

const RESET_TOKEN_RE = /^[A-Za-z0-9_-]{10,128}$/;

const ResetPasswordScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { logout } = useAuth();
  const token = searchParams.get("token") ?? "";

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

  const layoutProps = {
    title: "Actualizá tu acceso",
    sub: "Elegí una contraseña segura. Al confirmarla, cerraremos todas las sesiones activas.",
    image: "/img/security-identity-verification.webp",
  };

  if (!RESET_TOKEN_RE.test(token)) {
    return (
      <AuthSplitLayout {...layoutProps}>
        <GenericForm title="Link inválido">
          <p className={`${styles.alert} ${styles.alertError}`}>
            El link de recuperación es inválido o expiró. Pedí uno nuevo.
          </p>
          <p className={`${styles.auxLink} ${styles.alertSpaced}`}>
            <Link to="/recuperar-contrasena">Pedir nuevo link</Link>
          </p>
        </GenericForm>
      </AuthSplitLayout>
    );
  }

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

  return (
    <AuthSplitLayout {...layoutProps}>
      <GenericForm
        title="Nueva contraseña"
        description="Elegí una contraseña nueva para tu cuenta."
        onSubmit={handleSubmit}
      >
        <PasswordInput
          label="Nueva contraseña"
          name="newPassword"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
          helperText="Al menos 8 caracteres. No hace falta mayúsculas ni símbolos."
          error={
            newPassword.length > 0 && Array.from(newPassword).length < 8
              ? "La contraseña tiene que tener al menos 8 caracteres."
              : ""
          }
        />

        <PasswordInput
          label="Confirmar contraseña"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
          error={
            confirmPassword && newPassword !== confirmPassword
              ? "Las contraseñas no coinciden."
              : ""
          }
        />

        <HoneypotField value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />

        <div className={styles.turnstileWrapper}>
          <Turnstile
            ref={turnstile.ref}
            siteKey={TURNSTILE_SITE_KEY}
            onVerify={turnstile.onVerify}
            onExpire={turnstile.onClear}
            onError={turnstile.onClear}
          />
        </div>

        {error && <p className={`${styles.alert} ${styles.alertError}`}>{error}</p>}

        <div className={styles.formActions}>
          <GenericButton
            type="submit"
            loading={loading}
            disabled={
              loading ||
              !turnstile.token ||
              Array.from(newPassword).length < 8 ||
              !confirmPassword ||
              newPassword !== confirmPassword
            }
          >
            Cambiar contraseña
          </GenericButton>

          <p className={styles.auxLink}>
            <Link to="/ingresar">Volver a ingresar</Link>
          </p>
        </div>
      </GenericForm>
    </AuthSplitLayout>
  );
};

export default ResetPasswordScreen;
