import React, { memo } from "react";
import PropTypes from "prop-types";
import GenericForm from "../Forms/GenericForm/GenericForm.jsx";
import GenericButton from "../buttons/GenericButton/GenericButton.jsx";
import styles from "./OTPValidation.module.css";
import { OTP_CONFIG } from "../../constants/LOAN_SIM.js";
import { useOTPValidation } from "../../hooks/useOTPValidation.js";

const OTPValidation = ({
  onValidate,
  onResend,
  onBack,
  loading,
  error,
  destination,
  destinationType = "email",
}) => {
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
  } = useOTPValidation({ destination, onValidate, onResend });

  const title =
    destinationType === "phone" ? "Verificá tu celular" : "Verificá tu email";

  const description =
    destinationType === "phone"
      ? `Ingresá el código de ${OTP_CONFIG.OTP_LENGTH} dígitos que enviamos al ${destination}`
      : `Ingresá el código de ${OTP_CONFIG.OTP_LENGTH} dígitos que enviamos a ${destination}`;

  return (
    <GenericForm
      title={title}
      description={description}
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

OTPValidation.defaultProps = {
  destinationType: "email",
  destination: "",
};

OTPValidation.propTypes = {
  onValidate: PropTypes.func.isRequired,
  onResend: PropTypes.func,
  onBack: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.string,
  destination: PropTypes.string,
  destinationType: PropTypes.oneOf(["phone", "email"]),
};

export default memo(OTPValidation);