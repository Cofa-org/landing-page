import React, { memo } from "react";
import PropTypes from "prop-types";
import GenericForm from "../../../../Components/Forms/GenericForm/GenericForm.jsx";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import styles from "./OTPValidation.module.css";
import { OTP_CONFIG } from "../../../../constants/LOAN_SIM.js";
import { useOTPValidation } from "../../hooks/useOTPValidation.js";

const OTPValidation = ({ onValidate, onResend, onBack, loading, error, email }) => {
  const {
    otp,
    inputRefs,
    cooldown,
    isComplete,
    formatTime,
    handleChange,
    handleKeyDown,
    handlePaste,
    handleSubmit,
    handleResendClick,
  } = useOTPValidation({ email, onValidate, onResend });

  return (
    <GenericForm
      title='Verificá tu email'
      description={`Ingresá el código de ${OTP_CONFIG.OTP_LENGTH} dígitos que enviamos a ${email}`}
      onSubmit={handleSubmit}
      onBack={onBack}
      style={{
        width: "100%",
        height: "100%",
        gap: "5rem",
        margin: "0px",
        maxWidth: "none",
        minHeight: "760px",
        justifyContent: "center",
      }}
    >
      <div className={styles.otpContainer}>
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type='text'
            inputMode='numeric'
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={styles.digitInput}
            autoComplete='one-time-code'
          />
        ))}
      </div>

      <div className={styles.resendContainer}>
        {cooldown > 0 ? (
          <p className={styles.resendText}>
            Podrás reenviar el código en{" "}
            <span className={styles.timer}>{formatTime(cooldown)}</span>
          </p>
        ) : (
          <button
            type='button'
            className={styles.resendButton}
            onClick={handleResendClick}
            disabled={loading}
          >
            Reenviar código
          </button>
        )}
      </div>

      {error && <div className={styles.errorText}>{error}</div>}

      <GenericButton type='submit' loading={loading} disabled={!isComplete}>
        Verificar código
      </GenericButton>
    </GenericForm>
  );
};

OTPValidation.propTypes = {
  onValidate: PropTypes.func.isRequired,
  onResend: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.string,
  email: PropTypes.string.isRequired,
  onBack: PropTypes.func,
};

export default memo(OTPValidation);