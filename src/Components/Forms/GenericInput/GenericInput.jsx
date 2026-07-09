import React from "react";
import PropTypes from "prop-types";
import styles from "./GenericInput.module.css";

/**
 * GenericInput component for forms.
 * Follows /react-ui-designer workflow: Functional, CSS Modules, PropTypes.
 */
const GenericInput = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  helperText,
  required = false,
  ...props
}) => {
  const inputId = `input-${name}`;

  return (
    <div className={styles.container}>
      {label && (
        <label
          htmlFor={inputId}
          className={styles.label}
        >
          {label} {required && <span style={{ color: "#ff4d4f" }}>*</span>}
        </label>
      )}
      <div className={styles.inputWrapper}>
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${styles.input} ${error ? styles.inputError : ""}`}
          required={required}
          {...props}
        />
      </div>
      {helperText && !error && (
        <span className={styles.helperText}>{helperText}</span>
      )}
      <span className={styles.errorText}>{error && error}</span>
    </div>
  );
};

GenericInput.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  type: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
};

export default GenericInput;
