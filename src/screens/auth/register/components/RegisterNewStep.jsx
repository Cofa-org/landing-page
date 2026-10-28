import { Link } from "react-router-dom";
import GenericForm from "../../../../Components/Forms/GenericForm/GenericForm.jsx";
import GenericInput from "../../../../Components/Forms/GenericInput/GenericInput.jsx";
import PasswordInput from "../../../../Components/Forms/GenericInput/PasswordInput.jsx";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import Turnstile from "../../../../Components/Turnstile/Turnstile.jsx";
import { TURNSTILE_SITE_KEY } from "../../../../config.js";
import HoneypotField from "../../HoneypotField.jsx";
import AuthSplitLayout from "../../AuthSplitLayout.jsx";
import {
  PASSWORD_HELPER_TEXT,
  getPasswordPolicyError,
  isPasswordPolicyValid,
} from "../../passwordPolicy.js";
import styles from "../../auth.module.css";
import { AUTH_EMAIL_MAX_LENGTH } from "../../../../constants/AUTH.js";

const RegisterNewStep = ({
  email,
  setEmail,
  password,
  setPassword,
  honeypot,
  setHoneypot,
  turnstile,
  loading,
  error,
  onSubmit,
  onBack,
  locationState,
}) => (
  <AuthSplitLayout
    title="Empezá tu experiencia COFA"
    sub="Creá tu cuenta para ver el estado de tus solicitudes en cualquier momento."
  >
    <GenericForm title="Creá tu cuenta" onSubmit={onSubmit}>
      <GenericInput
        label="Email"
        name="email"
        type="email"
        maxLength={AUTH_EMAIL_MAX_LENGTH}
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
        minLength={8}
        helperText={PASSWORD_HELPER_TEXT}
        error={password.length > 0 ? getPasswordPolicyError(password) : ""}
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
            loading || !turnstile.token || !email.trim() || !isPasswordPolicyValid(password)
          }
        >
          Crear cuenta
        </GenericButton>
        <button type="button" className={styles.backLink} onClick={onBack}>
          ← Volver
        </button>
        <p className={styles.auxLink}>
          ¿Ya tenés cuenta?{" "}
          <Link to="/ingresar" state={locationState}>Ingresá</Link>
        </p>
      </div>
    </GenericForm>
  </AuthSplitLayout>
);

export default RegisterNewStep;
