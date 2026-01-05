import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import GenericForm from "../../../../Components/Forms/GenericForm/GenericForm.jsx";
import GenericButton from "../../../../Components/Forms/GenericButton/GenericButton.jsx";
import styles from "./OTPValidation.module.css";

const OTPValidation = ({ onValidate, loading, error, email }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus the first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;

    const newOtp = [...otp];
    // Take only the last character entered
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // If a digit was entered, move to the next input
    if (value && index < 5) {
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
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasteData) return;

    const newOtp = [...otp];
    const pasteChars = pasteData.split("");

    pasteChars.forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });

    setOtp(newOtp);

    // Focus the next empty input or the last one
    const nextIndex = Math.min(pasteChars.length, 5);
    inputRefs.current[nextIndex].focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length === 6) {
      onValidate(code);
    }
  };

  const isComplete = otp.every((digit) => digit !== "");

  return (
    <GenericForm
      title='Verificá tu email'
      description={`Ingresá el código de 6 dígitos que enviamos a ${email}`}
      onSubmit={handleSubmit}
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
  loading: PropTypes.bool,
  error: PropTypes.string,
  email: PropTypes.string.isRequired,
};

export default OTPValidation;
