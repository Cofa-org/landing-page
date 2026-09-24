import { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Header, Footer } from "../../Components/index.js";
import GenericForm from "../../Components/Forms/GenericForm/GenericForm.jsx";
import GenericInput from "../../Components/Forms/GenericInput/GenericInput.jsx";
import GenericButton from "../../Components/buttons/GenericButton/GenericButton.jsx";
import Turnstile from "../../Components/Turnstile/Turnstile.jsx";
import authService from "../../services/authService.js";
import { TURNSTILE_SITE_KEY } from "../../config.js";
import styles from "./auth.module.css";

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const turnstileRef = useRef(null);

  const handleTurnstileVerify = useCallback((t) => setTurnstileToken(t), []);
  const handleTurnstileClear = useCallback(() => setTurnstileToken(""), []);

  const handleSubmit = async () => {
    if (honeypot) return; // Silently ignore — probable bot
    if (!turnstileToken) {
      setError("Completá la verificación de seguridad.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim(), turnstileToken);
      setSent(true);
    } catch (err) {
      setError(err.message || "Ocurrió un error. Intentá de nuevo.");
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
        {/* Panel izquierdo */}
        <div className={styles.leftPanel}>
          <img src="/Logo.svg" alt="COFA" className={styles.leftPanelLogo} />
          <p className={styles.leftPanelTitle}>Seguridad ante todo</p>
          <p className={styles.leftPanelSub}>
            Tu información está protegida. El link de recuperación expira en 15 minutos.
          </p>
          <img
            src="/img/security-bank-encryption.webp"
            alt=""
            className={styles.leftPanelImage}
            loading="lazy"
          />
        </div>

        {/* Panel derecho */}
        <div className={styles.rightPanel}>
          {sent ? (
            <GenericForm title="Revisá tu bandeja de entrada">
              <p className={`${styles.alert} ${styles.alertSuccess}`}>
                Si el email está registrado y verificado, te enviamos el link para restablecer tu
                contraseña.
                <br />
                <br />
                El link vence en <strong>15 minutos</strong>.
              </p>
              <p className={`${styles.auxLink} ${styles.alertSpaced}`}>
                <Link to="/ingresar">Volver a ingresar</Link>
              </p>
            </GenericForm>
          ) : (
            <GenericForm
              title="Recuperar contraseña"
              description="Ingresá tu email y te enviamos un link para elegir una nueva contraseña."
              onSubmit={handleSubmit}
            >
              <GenericInput
                label="Email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoComplete="email"
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
                  disabled={loading || !turnstileToken || !email.trim()}
                >
                  Enviar link
                </GenericButton>

                <p className={styles.auxLink}>
                  <Link to="/ingresar">Volver a ingresar</Link>
                </p>
              </div>
            </GenericForm>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ForgotPasswordScreen;
