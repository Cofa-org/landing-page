import PasswordInput from "../../../Components/Forms/GenericInput/PasswordInput.jsx";
import GenericForm from "../../../Components/Forms/GenericForm/GenericForm.jsx";
import GenericButton from "../../../Components/buttons/GenericButton/GenericButton.jsx";
import Turnstile from "../../../Components/Turnstile/Turnstile.jsx";
import { TURNSTILE_SITE_KEY } from "../../../config.js";
import HoneypotField from "../HoneypotField.jsx";
import AuthSplitLayout from "../AuthSplitLayout.jsx";
import styles from "../auth.module.css";

const RegisterExistingStep = ({
  maskedEmail,
  password,
  setPassword,
  honeypot,
  setHoneypot,
  turnstile,
  loading,
  error,
  onSubmit,
  onBack,
}) => (
  <AuthSplitLayout
    title="Bienvenido de vuelta"
    sub="Encontramos un registro vinculado a tu identidad. Elegí una contraseña para acceder."
  >
    <GenericForm title="Activá tu cuenta" onSubmit={onSubmit}>
      <div className={styles.infoBox}>
        <p className={styles.infoBoxText}>
          Te enviaremos un código de verificación a:{" "}
          <strong>{maskedEmail}</strong>
        </p>
      </div>
      <PasswordInput
        label="Elegí una contraseña"
        name="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        required
        minLength={8}
        helperText="Al menos 8 caracteres. No hace falta mayúsculas ni símbolos."
        error={
          password.length > 0 && Array.from(password).length < 8
            ? "La contraseña tiene que tener al menos 8 caracteres."
            : ""
        }
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
          disabled={loading || !turnstile.token || Array.from(password).length < 8}
        >
          Activar cuenta
        </GenericButton>
        <button type="button" className={styles.backLink} onClick={onBack}>
          ← Volver
        </button>
      </div>
    </GenericForm>
  </AuthSplitLayout>
);

export default RegisterExistingStep;
