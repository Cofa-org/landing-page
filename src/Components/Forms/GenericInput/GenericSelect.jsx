import React from "react";
import PropTypes from "prop-types";
import styles from "./GenericSelect.module.css";

/**
 * GenericSelect component for forms.
 * Misma API que GenericInput, con prop `options` y `placeholder`.
 */
const GenericSelect = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = "Seleccioná una opción",
  error,
  helperText,
  required = false,
  ...props
}) => {
  const selectId = `select-${name}`;
  const isPlaceholder = value === "" || value == null;

  return (
    <div className={styles.container}>
      {label && (
        <label htmlFor={selectId} className={styles.label}>
          {label} {required && <span style={{ color: "#ff4d4f" }}>*</span>}
        </label>
      )}
      <div className={styles.selectWrapper}>
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
          className={`${styles.select} ${error ? styles.selectError : ""} ${isPlaceholder ? styles.selectPlaceholder : ""}`}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {helperText && !error && (
        <span id={`${selectId}-helper`} className={styles.helperText}>
          {helperText}
        </span>
      )}
      {error && (
        <span id={`${selectId}-error`} className={styles.errorText}>
          {error}
        </span>
      )}
    </div>
  );
};

GenericSelect.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  placeholder: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
};

export default GenericSelect;
