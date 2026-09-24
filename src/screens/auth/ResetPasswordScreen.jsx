import { useCallback, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Header, Footer } from "../../Components/index.js";
import GenericForm from "../../Components/Forms/GenericForm/GenericForm.jsx";
import PasswordInput from "../../Components/Forms/GenericInput/PasswordInput.jsx";
import GenericButton from "../../Components/buttons/GenericButton/GenericButton.jsx";
import Turnstile from "../../Components/Turnstile/Turnstile.jsx";
import authService from "../../services/authService.js";
import { useAuth } from "../../context/index.js";
import { TURNSTILE_SITE_KEY } from "../../config.js";
import styles from "./auth.module.css";

const ResetPasswordScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { logout } = useAuth();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const turnstileRef = useRef(null);

  const handleTurnstileVerify = useCallback((t) => setTurnstileToken(t), []);
  const handleTurnstileClear = useCallback(() => setTurnstileToken(""), []);

  /* ── Panel izquierdo ── */
  const leftPanel = (
    <div className={styles.leftPanel}>
      <img src="/Logo.svg" alt="COFA" className={styles.leftPanelLogo} />
      <p className={styles.leftPanelTitle}>Actualizá tu acceso</p>
      <p className={styles.leftPanelSub}>
        Elegí una contraseña segura. Al confirmarla, cerraremos todas las sesiones activas.
      </p>
      <img
        src="/img/security-identity-verification.webp"
        alt=""
        className={styles.leftPanelImage}
        loading="lazy"
      />
    </div>
  );

  /* Token ausente o claramente inválido → aviso inmediato */
  if (!token || token.length < 10) {
    return (
      <>
        <Header />
        <div className={styles.splitLayout}>
          {leftPanel}
          <div className={styles.rightPanel}>
            <GenericForm title="Link inválido">
              <p className={`${styles.alert} ${styles.alertError}`}>
                El link de recuperación es inválido o expiró. Pedí uno nuevo.
              </p>
              <p className={`${styles.auxLink} ${styles.alertSpaced}`}>
                <Link to="/recuperar-contrasena">Pedir nuevo link</Link>
              </p>
            </GenericForm>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const handleSubmit = async () => {
    if (honeypot) return; // Silently ignore — probable bot
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!turnstileToken) {
      setError("Completá la verificación de seguridad.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authService.resetPassword(token, newPassword, turnstileToken);
      // El backend revocó todas las sesiones → limpiamos el estado local también
      await logout();
      navigate("/ingresar", {
        replace: true,
        state: { successMessage: "¡Contraseña actualizada! Ya podés ingresar con la nueva contraseña." },
      });
    } catch (err) {
      setError(err.message || "El link es inválido o expiró. Pedí uno nuevo.");
      turnstileRef.current?.reset();
      setTurnstileToken("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className={styles.splitLayout}>
        {leftPanel}
        <div className={styles.rightPanel}>
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
              helperText="Mínimo 8 caracteres."
            />

            <PasswordInput
              label="Confirmar contraseña"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              error={
                confirmPassword && newPassword !== confirmPassword
                  ? "Las contraseñas no coinciden."
                  : ""
              }
            />

            {/* Honeypot — campo oculto anti-bot */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              style={{ position: "absolute", left: "-9999px", top: "auto", width: "1px", height: "1px", overflow: "hidden", opacity: 0 }}
            />

            <div className={styles.turnstileWrapper}>
              <Turnstile
                ref={turnstileRef}
                siteKey={TURNSTILE_SITE_KEY}
                onVerify={handleTurnstileVerify}
                onExpire={handleTurnstileClear}
                onError={handleTurnstileClear}
              />
            </div>

            {error && <p className={`${styles.alert} ${styles.alertError}`}>{error}</p>}

            <div className={styles.formActions}>
              <GenericButton
                type="submit"
                loading={loading}
                disabled={
                  loading ||
                  !turnstileToken ||
                  !newPassword ||
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
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ResetPasswordScreen;
