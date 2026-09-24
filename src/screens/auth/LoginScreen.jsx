import { useCallback, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Header, Footer } from "../../Components/index.js";
import GenericForm from "../../Components/Forms/GenericForm/GenericForm.jsx";
import GenericInput from "../../Components/Forms/GenericInput/GenericInput.jsx";
import PasswordInput from "../../Components/Forms/GenericInput/PasswordInput.jsx";
import GenericButton from "../../Components/buttons/GenericButton/GenericButton.jsx";
import Turnstile from "../../Components/Turnstile/Turnstile.jsx";
import { useAuth } from "../../context/index.js";
import { TURNSTILE_SITE_KEY } from "../../config.js";
import styles from "./auth.module.css";

const LoginScreen = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const turnstileRef = useRef(null);

  const handleTurnstileVerify = useCallback((t) => setTurnstileToken(t), []);
  const handleTurnstileClear = useCallback(() => setTurnstileToken(""), []);

  // Mensaje de éxito pasado desde RegisterScreen o ResetPasswordScreen
  const successMessage = location.state?.successMessage ?? "";

  const handleSubmit = async () => {
    if (honeypot) return; // Silently ignore — probable bot
    if (!turnstileToken) {
      setError("Completá la verificación de seguridad.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password, turnstileToken);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "No pudimos iniciar sesión. Revisá los datos e intentá de nuevo.");
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
          <p className={styles.leftPanelTitle}>Bienvenido de vuelta</p>
          <p className={styles.leftPanelSub}>
            Ingresá para ver el estado de tus solicitudes y gestionar tu cuenta.
          </p>
          <img
            src="/img/security-cofa-trust.webp"
            alt=""
            className={styles.leftPanelImage}
            loading="lazy"
          />
        </div>

        {/* Panel derecho: formulario */}
        <div className={styles.rightPanel}>
          <GenericForm
            title="Ingresá a tu cuenta"
            onSubmit={handleSubmit}
          >
            {successMessage && (
              <p className={`${styles.alert} ${styles.alertSuccess} ${styles.alertSpaced}`}>
                {successMessage}
              </p>
            )}

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

            <PasswordInput
              label="Contraseña"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className={styles.auxLink} style={{ textAlign: "right", marginTop: "-8px" }}>
              <Link to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>
            </div>

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
                disabled={loading || !turnstileToken || !email.trim() || !password}
              >
                Ingresar
              </GenericButton>

              <p className={styles.auxLink}>
                ¿No tenés cuenta?{" "}
                <Link to="/crear-cuenta">Registrate</Link>
              </p>
            </div>
          </GenericForm>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default LoginScreen;
