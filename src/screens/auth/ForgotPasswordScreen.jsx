import { useState } from "react";
import { Link } from "react-router-dom";
import GenericForm from "../../Components/Forms/GenericForm/GenericForm.jsx";
import GenericInput from "../../Components/Forms/GenericInput/GenericInput.jsx";
import GenericButton from "../../Components/buttons/GenericButton/GenericButton.jsx";
import Turnstile from "../../Components/Turnstile/Turnstile.jsx";
import authService from "../../services/authService.js";
import { TURNSTILE_SITE_KEY } from "../../config.js";
import HoneypotField from "./HoneypotField.jsx";
import AuthSplitLayout from "./AuthSplitLayout.jsx";
import { useTurnstile } from "./useTurnstile.js";
import { useAsyncSubmit } from "./useAsyncSubmit.js";
import styles from "./auth.module.css";

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [sent, setSent] = useState(false);
  const turnstile = useTurnstile();

  const { loading, error, setError, run } = useAsyncSubmit({
    submit: () => authService.forgotPassword(email.trim(), turnstile.token),
  });

  const handleSubmit = async () => {
    if (honeypot) return;
    if (!turnstile.token) {
      setError("Completá la verificación de seguridad.");
      return;
    }
    try {
      await run();
      setSent(true);
    } catch {
      turnstile.reset();
    }
  };

  return (
    <AuthSplitLayout
      title="Seguridad ante todo"
      sub="Tu información está protegida. El link de recuperación expira en 15 minutos."
      image="/img/security-bank-encryption.webp"
    >
      {sent ? (
        <GenericForm title="Revisá tu bandeja de entrada">
          <p className={`${styles.alert} ${styles.alertSuccess}`}>
            Si el email está registrado, te enviamos un mail para continuar.
            Si todavía no confirmaste la cuenta, llega un código de 6 dígitos.
            Si ya está verificada, un link para restablecer la contraseña.
            <br />
            <br />
            El mail vence en <strong>15 minutos</strong>.
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
              disabled={loading || !turnstile.token || !email.trim()}
            >
              Enviar link
            </GenericButton>

            <p className={styles.auxLink}>
              <Link to="/ingresar">Volver a ingresar</Link>
            </p>
          </div>
        </GenericForm>
      )}
    </AuthSplitLayout>
  );
};

export default ForgotPasswordScreen;
