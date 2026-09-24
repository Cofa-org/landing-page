import { useCallback, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header, Footer } from "../../Components/index.js";
import GenericForm from "../../Components/Forms/GenericForm/GenericForm.jsx";
import GenericInput from "../../Components/Forms/GenericInput/GenericInput.jsx";
import PasswordInput from "../../Components/Forms/GenericInput/PasswordInput.jsx";
import GenericButton from "../../Components/buttons/GenericButton/GenericButton.jsx";
import Turnstile from "../../Components/Turnstile/Turnstile.jsx";
import OTPValidation from "../../Components/OTPValidation/OTPValidation.jsx";
import authService from "../../services/authService.js";
import { TURNSTILE_SITE_KEY } from "../../config.js";
import styles from "./auth.module.css";

const STEP = { REGISTER: "register", VERIFY: "verify" };

const RegisterScreen = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(STEP.REGISTER);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [honeypot, setHoneypot] = useState("");

  // Paso 1
  const [turnstileToken1, setTurnstileToken1] = useState("");
  const turnstileRef1 = useRef(null);
  const [loading1, setLoading1] = useState(false);
  const [error1, setError1] = useState("");

  // Paso 2 — token para verifyEmail y resendOtp
  const [turnstileToken2, setTurnstileToken2] = useState("");
  const turnstileRef2 = useRef(null);
  const [loading2, setLoading2] = useState(false);
  const [error2, setError2] = useState("");

  // Callbacks estables para Turnstile
  const handleVerify1 = useCallback((t) => setTurnstileToken1(t), []);
  const handleClear1 = useCallback(() => setTurnstileToken1(""), []);
  const handleVerify2 = useCallback((t) => setTurnstileToken2(t), []);
  const handleClear2 = useCallback(() => setTurnstileToken2(""), []);

  /* ── Paso 1: registrar cuenta ── */
  const handleRegister = async () => {
    if (honeypot) return; // Silently ignore — probable bot
    if (!turnstileToken1) {
      setError1("Completá la verificación de seguridad.");
      return;
    }
    setError1("");
    setLoading1(true);
    try {
      await authService.register(email.trim(), password, turnstileToken1);
      setStep(STEP.VERIFY);
    } catch (err) {
      setError1(err.message || "No pudimos crear la cuenta. Intentá de nuevo.");
      turnstileRef1.current?.reset();
      setTurnstileToken1("");
    } finally {
      setLoading1(false);
    }
  };

  /* ── Paso 2: verificar email ── */
  const handleVerify = async (code) => {
    setError2("");
    setLoading2(true);
    try {
      await authService.verifyEmail(email.trim(), code, turnstileToken2);
      navigate("/ingresar", {
        replace: true,
        state: { successMessage: "¡Cuenta creada! Ya podés ingresar con tu contraseña." },
      });
    } catch (err) {
      setError2(err.message || "El código es inválido o expiró. Pedí uno nuevo.");
      turnstileRef2.current?.reset();
      setTurnstileToken2("");
    } finally {
      setLoading2(false);
    }
  };

  const handleResend = async () => {
    try {
      await authService.resendOtp(email.trim(), turnstileToken2);
    } catch {
      // Respuesta siempre genérica
    } finally {
      turnstileRef2.current?.reset();
      setTurnstileToken2("");
    }
  };

  /* ── Panel izquierdo compartido ── */
  const LeftPanel = ({ title, sub }) => (
    <div className={styles.leftPanel}>
      <img src="/Logo.svg" alt="COFA" className={styles.leftPanelLogo} />
      <p className={styles.leftPanelTitle}>{title}</p>
      <p className={styles.leftPanelSub}>{sub}</p>
      <img
        src="/img/welcome_success_celebration.webp"
        alt=""
        className={styles.leftPanelImage}
        loading="lazy"
      />
    </div>
  );

  /* ── Paso 2: verificación OTP ── */
  if (step === STEP.VERIFY) {
    return (
      <>
        <Header />
        <div className={styles.splitLayout}>
          <LeftPanel
            title="Verificá tu email"
            sub="Te enviamos un código de 6 dígitos. Ingresalo para activar tu cuenta."
          />
          <div className={styles.rightPanel}>
            <div style={{ width: "100%", maxWidth: "450px" }}>
              <OTPValidation
                destination={email}
                destinationType="email"
                onValidate={handleVerify}
                onResend={handleResend}
                onBack={() => setStep(STEP.REGISTER)}
                loading={loading2}
                error={error2}
              />
              <div className={styles.turnstileWrapper} style={{ marginTop: "16px" }}>
                <Turnstile
                  ref={turnstileRef2}
                  siteKey={TURNSTILE_SITE_KEY}
                  onVerify={handleVerify2}
                  onExpire={handleClear2}
                  onError={handleClear2}
                />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  /* ── Paso 1: formulario de registro ── */
  return (
    <>
      <Header />
      <div className={styles.splitLayout}>
        <LeftPanel
          title="Empezá tu experiencia COFA"
          sub="Creá tu cuenta para ver el estado de tus solicitudes en cualquier momento."
        />
        <div className={styles.rightPanel}>
          <GenericForm
            title="Creá tu cuenta"
            onSubmit={handleRegister}
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

            <PasswordInput
              label="Contraseña"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              helperText="Mínimo 8 caracteres."
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
                ref={turnstileRef1}
                siteKey={TURNSTILE_SITE_KEY}
                onVerify={handleVerify1}
                onExpire={handleClear1}
                onError={handleClear1}
              />
            </div>

            {error1 && <p className={`${styles.alert} ${styles.alertError}`}>{error1}</p>}

            <div className={styles.formActions}>
              <GenericButton
                type="submit"
                loading={loading1}
                disabled={loading1 || !turnstileToken1 || !email.trim() || !password}
              >
                Crear cuenta
              </GenericButton>

              <p className={styles.auxLink}>
                ¿Ya tenés cuenta?{" "}
                <Link to="/ingresar">Ingresá</Link>
              </p>
            </div>
          </GenericForm>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default RegisterScreen;
