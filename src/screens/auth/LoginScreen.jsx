import { useCallback, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Header, Footer } from "../../Components/index.js";
import GenericForm from "../../Components/Forms/GenericForm/GenericForm.jsx";
import GenericInput from "../../Components/Forms/GenericInput/GenericInput.jsx";
import PasswordInput from "../../Components/Forms/GenericInput/PasswordInput.jsx";
import GenericButton from "../../Components/buttons/GenericButton/GenericButton.jsx";
import Turnstile from "../../Components/Turnstile/Turnstile.jsx";
import OTPValidation from "../../Components/OTPValidation/OTPValidation.jsx";
import { useAuth } from "../../context/index.js";
import authService from "../../services/authService.js";
import { TURNSTILE_SITE_KEY } from "../../config.js";
import HoneypotField from "./HoneypotField.jsx";
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
  const [needsVerify, setNeedsVerify] = useState(false);

  const turnstileRef = useRef(null);
  const turnstileVerifyRef = useRef(null);
  const [turnstileVerify, setTurnstileVerify] = useState("");

  const handleTurnstileVerify = useCallback((t) => setTurnstileToken(t), []);
  const handleTurnstileClear = useCallback(() => setTurnstileToken(""), []);
  const onVerifyVerify = useCallback((t) => setTurnstileVerify(t), []);
  const onClearVerify = useCallback(() => setTurnstileVerify(""), []);

  const successMessage = location.state?.successMessage ?? "";

  const handleSubmit = async () => {
    if (honeypot) return;
    if (!turnstileToken) {
      setError("Completá la verificación de seguridad.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password, turnstileToken);
      navigate("/mi-perfil", { replace: true });
    } catch (err) {
      if (err.cause === "AUTH_EMAIL_NOT_VERIFIED") {
        setNeedsVerify(true);
        setError("");
        return;
      }
      setError(err.message || "No pudimos iniciar sesión. Revisá los datos e intentá de nuevo.");
      turnstileRef.current?.reset();
      setTurnstileToken("");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (code) => {
    if (!turnstileVerify) {
      setError("Completá la verificación de seguridad.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authService.verifyEmail(email.trim(), code, turnstileVerify);
      navigate("/ingresar", {
        replace: true,
        state: {
          successMessage: "¡Email confirmado! Ya podés ingresar.",
          from: location.state?.from,
        },
      });
    } catch (err) {
      setError(err.message || "El código es inválido o expiró. Pedí uno nuevo.");
      turnstileVerifyRef.current?.reset();
      setTurnstileVerify("");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!turnstileVerify) {
      setError("Completá la verificación de seguridad.");
      return;
    }
    try {
      await authService.resendOtp(email.trim(), turnstileVerify);
    } catch {
      // genérico
    } finally {
      turnstileVerifyRef.current?.reset();
      setTurnstileVerify("");
    }
  };

  if (needsVerify) {
    return (
      <>
        <Header />
        <div className={styles.splitLayout}>
          <div className={styles.leftPanel}>
            <img src="/Logo.svg" alt="COFA" className={styles.leftPanelLogo} />
            <p className={styles.leftPanelTitle}>Confirmá tu email</p>
            <p className={styles.leftPanelSub}>
              Tu cuenta existe pero el mail todavía no está verificado. Ingresá el código para activarla.
            </p>
            <img
              src="/img/welcome_success_celebration.webp"
              alt=""
              className={styles.leftPanelImage}
              loading="lazy"
            />
          </div>
          <div className={styles.rightPanel}>
            <div style={{ width: "100%", maxWidth: "450px" }}>
              <OTPValidation
                destination={email.trim()}
                destinationType="email"
                onValidate={handleVerify}
                onResend={handleResend}
                onBack={() => setNeedsVerify(false)}
                loading={loading}
                error={error}
              >
                <div className={styles.turnstileWrapper} style={{ marginTop: "8px" }}>
                  <Turnstile
                    ref={turnstileVerifyRef}
                    siteKey={TURNSTILE_SITE_KEY}
                    appearance="always"
                    onVerify={onVerifyVerify}
                    onExpire={onClearVerify}
                    onError={onClearVerify}
                  />
                </div>
              </OTPValidation>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

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

            <HoneypotField value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />

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
                <Link to="/crear-cuenta" state={location.state}>Registrate</Link>
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
