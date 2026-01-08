import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import GenericForm from "../../../../Components/Forms/GenericForm/GenericForm.jsx";
import GenericButton from "../../../../Components/Forms/GenericButton/GenericButton.jsx";
import styles from "./OTPValidation.module.css";
import { OTP_CONFIG } from "../../../../constants/LOAN_SIM.js";

const OTPValidation = ({ onValidate, onResend, onBack, loading, error, email }) => {
  const [otp, setOtp] = useState(new Array(OTP_CONFIG.OTP_LENGTH).fill(""));
  const inputRefs = useRef([]);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    // Focus the first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }

    // Check for existing cooldown in localStorage
    const savedExpiry = localStorage.getItem("otp_cooldown_expiry");
    if (savedExpiry) {
      const remaining = Math.ceil((parseInt(savedExpiry, 10) - Date.now()) / 1000);
      if (remaining > 0) {
        setCooldown(remaining);
      } else {
        localStorage.removeItem("otp_cooldown_expiry");
      }
    }
  }, []);

  useEffect(() => {
    let interval;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => {
          const newCooldown = prev - 1;
          if (newCooldown <= 0) {
            localStorage.removeItem("otp_cooldown_expiry");
            return 0;
          }
          return newCooldown;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleResendClick = async () => {
    if (cooldown > 0 || loading) return;

    if (onResend) {
      await onResend(email, true);
      const expiry = Date.now() + OTP_CONFIG.COOLDOWN_DURATION * 1000;
      localStorage.setItem("otp_cooldown_expiry", expiry.toString());
      setCooldown(OTP_CONFIG.COOLDOWN_DURATION);
    }
  };

  const handleChange = (index, value) => {
    if (isNaN(value)) return;

    const newOtp = [...otp];
    // Take only the last character entered
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // If a digit was entered, move to the next input
    if (value && index < OTP_CONFIG.OTP_LENGTH - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // If backspace is pressed and the current input is empty, move to the previous input
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_CONFIG.OTP_LENGTH);
    if (!pasteData) return;

    const newOtp = [...otp];
    const pasteChars = pasteData.split("");

    pasteChars.forEach((char, i) => {
      if (i < OTP_CONFIG.OTP_LENGTH) newOtp[i] = char;
    });

    setOtp(newOtp);

    // Focus the next empty input or the last one
    const nextIndex = Math.min(pasteChars.length, OTP_CONFIG.OTP_LENGTH - 1);
    inputRefs.current[nextIndex].focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length === OTP_CONFIG.OTP_LENGTH) {
      onValidate(code);
    }
  };

  const isComplete = otp.every((digit) => digit !== "");

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

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

      <GenericButton
        type='submit'
        loading={loading}
        disabled={!isComplete}
      >
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

export default OTPValidation;
