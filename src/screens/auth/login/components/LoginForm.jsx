import { Link } from "react-router-dom";
import GenericForm from "../../../../Components/Forms/GenericForm/GenericForm.jsx";
import GenericInput from "../../../../Components/Forms/GenericInput/GenericInput.jsx";
import PasswordInput from "../../../../Components/Forms/GenericInput/PasswordInput.jsx";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import Turnstile from "../../../../Components/Turnstile/Turnstile.jsx";
import { TURNSTILE_SITE_KEY } from "../../../../config.js";
import HoneypotField from "../../HoneypotField.jsx";
import AuthSplitLayout from "../../AuthSplitLayout.jsx";
import styles from "../../auth.module.css";

const LoginForm = ({
  email,
  setEmail,
  password,
  setPassword,
  honeypot,
  setHoneypot,
  turnstile,
  loading,
  error,
  successMessage,
  onSubmit,
  locationState,
}) => (
  <AuthSplitLayout
    title="Bienvenido de vuelta"
    sub="Ingresá para ver el estado de tus solicitudes y gestionar tu cuenta."
    image="/img/security-cofa-trust.webp"
  >
    <GenericForm title="Ingresá a tu cuenta" onSubmit={onSubmit}>
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
          <Link to="/crear-cuenta" state={locationState}>Registrate</Link>
        </p>
      </div>
    </GenericForm>
  </AuthSplitLayout>
);

export default LoginForm;
