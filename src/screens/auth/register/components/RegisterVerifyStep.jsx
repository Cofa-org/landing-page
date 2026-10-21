import OTPValidation from "../../../../Components/OTPValidation/OTPValidation.jsx";
import Turnstile from "../../../../Components/Turnstile/Turnstile.jsx";
import { TURNSTILE_SITE_KEY } from "../../../../config.js";
import { AUTH_OTP_CONFIG } from "../../../../constants/AUTH.js";
import AuthSplitLayout from "../../AuthSplitLayout.jsx";
import styles from "../../auth.module.css";

const RegisterVerifyStep = ({
  destination,
  onValidate,
  onResend,
  onBack,
  loading,
  error,
  turnstile,
}) => (
  <AuthSplitLayout
    title="Verificá tu email"
    sub="Te enviamos un código de 6 dígitos. Ingresalo para activar tu cuenta."
  >
    <div style={{ width: "100%", maxWidth: "450px" }}>
      <OTPValidation
        destination={destination}
        destinationType="email"
        onValidate={onValidate}
        onResend={onResend}
        onBack={onBack}
        loading={loading}
        error={error}
        startCooldownOnMount
        cooldownSeconds={AUTH_OTP_CONFIG.RESEND_COOLDOWN_SECONDS}
      >
        <div className={styles.turnstileWrapper} style={{ marginTop: "8px" }}>
          <Turnstile
            ref={turnstile.ref}
            siteKey={TURNSTILE_SITE_KEY}
            appearance="always"
            onVerify={turnstile.onVerify}
            onExpire={turnstile.onClear}
            onError={turnstile.onClear}
          />
        </div>
      </OTPValidation>
    </div>
  </AuthSplitLayout>
);

export default RegisterVerifyStep;
