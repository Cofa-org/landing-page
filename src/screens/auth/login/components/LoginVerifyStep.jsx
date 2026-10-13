import OTPValidation from "../../../../Components/OTPValidation/OTPValidation.jsx";
import Turnstile from "../../../../Components/Turnstile/Turnstile.jsx";
import { TURNSTILE_SITE_KEY } from "../../../../config.js";
import AuthSplitLayout from "../../AuthSplitLayout.jsx";
import styles from "../../auth.module.css";

const LoginVerifyStep = ({
  destination,
  onValidate,
  onResend,
  onBack,
  loading,
  error,
  turnstile,
}) => (
  <AuthSplitLayout
    title="Confirmá tu email"
    sub="Tu cuenta existe pero el mail todavía no está verificado. Ingresá el código para activarla."
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

export default LoginVerifyStep;
