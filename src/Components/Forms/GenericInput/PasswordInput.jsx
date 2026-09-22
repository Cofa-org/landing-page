import { useState } from "react";
import PropTypes from "prop-types";
import { FiEye, FiEyeOff } from "react-icons/fi";
import styles from "./GenericInput.module.css";
import pwdStyles from "./PasswordInput.module.css";

/**
 * Campo de contraseña con botón para mostrar/ocultar el texto.
 * Mismo look que GenericInput, comparte sus CSS Modules.
 */
const PasswordInput = ({
  label,
  name,
  value,
  onChange,
  error,
  placeholder = "••••••••",
  required = false,
  autoComplete = "current-password",
  ...props
}) => {
  const [show, setShow] = useState(false);
  const inputId = `input-${name}`;

  return (
    <div className={styles.container}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label} {required && <span style={{ color: "#ff4d4f" }}>*</span>}
        </label>
      )}
      <div className={styles.inputWrapper}>
        <input
          id={inputId}
          name={name}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${styles.input} ${pwdStyles.input} ${error ? styles.inputError : ""}`}
          required={required}
          autoComplete={autoComplete}
          {...props}
        />
        <button
          type="button"
          className={pwdStyles.toggle}
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
          tabIndex={-1}
        >
          {show ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
      <span className={styles.errorText}>{error && error}</span>
    </div>
  );
};

PasswordInput.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  autoComplete: PropTypes.string,
};

export default PasswordInput;
