import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
import AuthSplitLayout from "./AuthSplitLayout.jsx";
import { useTurnstile } from "./useTurnstile.js";
import { consumeAuthFlash, writeAuthFlash } from "./authFlash.js";
import styles from "./auth.module.css";

const LoginScreen = () => {
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

  if (needsVerify) {
    return (
      <AuthSplitLayout
        title="Confirmá tu email"
        sub="Tu cuenta existe pero el mail todavía no está verificado. Ingresá el código para activarla."
      >
        <div style={{ width: "100%", maxWidth: "450px" }}>
          <OTPValidation
            destination={email.trim()}
            destinationType="email"
            onValidate={handleVerify}
            onResend={handleResend}
            onBack={() => setNeedsVerify(false)}
            loading={loading}
            error={error}
            startCooldownOnMount
          >
            <div className={styles.turnstileWrapper} style={{ marginTop: "8px" }}>
              <Turnstile
                ref={turnstileVerify.ref}
                siteKey={TURNSTILE_SITE_KEY}
                appearance="always"
                onVerify={turnstileVerify.onVerify}
                onExpire={turnstileVerify.onClear}
                onError={turnstileVerify.onClear}
              />
            </div>
          </OTPValidation>
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout
      title="Bienvenido de vuelta"
      sub="Ingresá para ver el estado de tus solicitudes y gestionar tu cuenta."
      image="/img/security-cofa-trust.webp"
    >
      <GenericForm title="Ingresá a tu cuenta" onSubmit={handleSubmit}>
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
          minLength={8}
        />

        <div className={`${styles.auxLink} ${styles.forgotPasswordLink}`}>
          <Link to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>
        </div>

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
            disabled={loading || !turnstile.token || !email.trim() || !password}
          >
            Ingresar
          </GenericButton>

          <p className={styles.auxLink}>
            ¿No tenés cuenta?{" "}
            <Link to="/crear-cuenta" state={location.state}>Registrate</Link>
          </p>
        </div>
      </GenericForm>
    </AuthSplitLayout>
  );
};

export default LoginScreen;
