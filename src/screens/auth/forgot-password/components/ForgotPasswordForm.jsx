import { Link } from "react-router-dom";
import GenericForm from "../../../../Components/Forms/GenericForm/GenericForm.jsx";
import GenericInput from "../../../../Components/Forms/GenericInput/GenericInput.jsx";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import Turnstile from "../../../../Components/Turnstile/Turnstile.jsx";
import { TURNSTILE_SITE_KEY } from "../../../../config.js";
import HoneypotField from "../../HoneypotField.jsx";
import AuthSplitLayout from "../../AuthSplitLayout.jsx";
import styles from "../../auth.module.css";

const ForgotPasswordForm = ({
  email,
  setEmail,
  honeypot,
  setHoneypot,
  turnstile,
  loading,
  error,
  onSubmit,
}) => (
  <AuthSplitLayout
    title="Seguridad ante todo"
    sub="Tu información está protegida. El link de recuperación expira en 20 minutos."
    image="/img/security-bank-encryption.webp"
  >
    <GenericForm
      title="Recuperar contraseña"
      description="Ingresá tu email y te enviamos un link para elegir una nueva contraseña."
      onSubmit={onSubmit}
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
  </AuthSplitLayout>
);

export default ForgotPasswordForm;
