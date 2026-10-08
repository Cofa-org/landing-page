import { Link } from "react-router-dom";
import GenericForm from "../../../Components/Forms/GenericForm/GenericForm.jsx";
import GenericInput from "../../../Components/Forms/GenericInput/GenericInput.jsx";
import GenericButton from "../../../Components/buttons/GenericButton/GenericButton.jsx";
import Turnstile from "../../../Components/Turnstile/Turnstile.jsx";
import { TURNSTILE_SITE_KEY } from "../../../config.js";
import HoneypotField from "../HoneypotField.jsx";
import AuthSplitLayout from "../AuthSplitLayout.jsx";
import styles from "../auth.module.css";

const RegisterDniStep = ({
  dni,
  setDni,
  honeypot,
  setHoneypot,
  turnstile,
  loading,
  error,
  onSubmit,
  locationState,
}) => (
  <AuthSplitLayout
    title="Empezá tu experiencia COFA"
    sub="Ingresá tu DNI para verificar tu identidad y crear tu cuenta."
  >
    <GenericForm title="Verificá tu identidad" onSubmit={onSubmit}>
      <GenericInput
        label="DNI"
        name="dni"
        type="text"
        inputMode="numeric"
        value={dni}
        onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
        placeholder="Ej: 30123456"
        required
        autoComplete="off"
        maxLength={8}
        helperText="Sin puntos ni guiones."
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
          disabled={loading || !turnstile.token || dni.trim().length < 7}
        >
          Continuar
        </GenericButton>
        <p className={styles.auxLink}>
          ¿Ya tenés cuenta?{" "}
          <Link to="/ingresar" state={locationState}>Ingresá</Link>
        </p>
      </div>
    </GenericForm>
  </AuthSplitLayout>
);

export default RegisterDniStep;
