import { Link } from "react-router-dom";
import GenericForm from "../../../../Components/Forms/GenericForm/GenericForm.jsx";
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
import { RESET_LAYOUT } from "../hooks/useResetPassword.js";
import styles from "../../auth.module.css";

const ResetPasswordForm = ({
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  honeypot,
  setHoneypot,
  turnstile,
  loading,
  error,
  onSubmit,
}) => (
  <AuthSplitLayout {...RESET_LAYOUT}>
    <GenericForm
      title="Nueva contraseña"
      description="Elegí una contraseña nueva para tu cuenta."
      onSubmit={onSubmit}
    >
      <PasswordInput
        label="Nueva contraseña"
        name="newPassword"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        autoComplete="new-password"
        required
        minLength={8}
        helperText={PASSWORD_HELPER_TEXT}
        error={newPassword.length > 0 ? getPasswordPolicyError(newPassword) : ""}
      />

      <PasswordInput
        label="Confirmar contraseña"
        name="confirmPassword"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        autoComplete="new-password"
        required
        minLength={8}
        error={
          confirmPassword && newPassword !== confirmPassword
            ? "Las contraseñas no coinciden."
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
          disabled={
            loading ||
            !turnstile.token ||
            !isPasswordPolicyValid(newPassword) ||
            !confirmPassword ||
            newPassword !== confirmPassword
          }
        >
          Cambiar contraseña
        </GenericButton>

        <p className={styles.auxLink}>
          <Link to="/ingresar">Volver a ingresar</Link>
        </p>
      </div>
    </GenericForm>
  </AuthSplitLayout>
);

export default ResetPasswordForm;
