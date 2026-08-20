import React, { memo } from "react";
import PropTypes from "prop-types";
import styles from "./PhonePickerStep.module.css";

/**
 * Devuelve el número tal cual lo manda el back (10 dígitos, sin
 * separadores). El back ahora garantiza que el primer dígito sea 0-3
 * (rangos válidos de celulares argentinos), por lo que no necesitamos
 * agregar separadores. Devuelve el string original si no tiene exactamente
 * 10 dígitos (defensa silenciosa).
 */
const formatPhone = (digits) => {
  if (typeof digits !== "string" || digits.length !== 10) return digits;
  return digits;
};

const EXPECTED_OPTIONS_LENGTH = 4;

const PhonePickerStep = ({ options, onPick, loading, error }) => {
  if (!Array.isArray(options) || options.length !== EXPECTED_OPTIONS_LENGTH) {
    console.error(
      "PhonePickerStep: options must be an array of exactly 4 strings; got",
      options,
    );
    return null;
  }

  const titleId = "phone-picker-title";
  const subtitleId = "phone-picker-subtitle";
  const errorId = "phone-picker-error";

  return (
    <section
      className={styles.container}
      aria-busy={loading}
      aria-labelledby={titleId}
      aria-describedby={error ? errorId : subtitleId}
    >
      <header className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          ¿Cuál de estos números es tu celular?
        </h2>
        <p id={subtitleId} className={styles.subtitle}>
          Elegí el que usás habitualmente para que podamos confirmarlo.
        </p>
      </header>

      {error && (
        <div
          id={errorId}
          role="alert"
          aria-live="assertive"
          className={styles.errorBanner}
        >
          {error}
        </div>
      )}

      <ul className={styles.optionsList}>
        {options.map((opcion, idx) => (
          <li key={opcion} className={styles.optionItem}>
            <button
              type="button"
              className={styles.optionButton}
              onClick={() => onPick(opcion)}
              disabled={loading}
              data-testid={`phone-picker-option-${opcion}`}
              aria-label={`Opción ${idx + 1}: ${formatPhone(opcion)}`}
            >
              <span className={styles.optionIndex} aria-hidden="true">
                {idx + 1}
              </span>
              <span className={styles.optionDigits}>{formatPhone(opcion)}</span>
            </button>
          </li>
        ))}
      </ul>

      {loading && (
        <p className={styles.loadingText} aria-live="polite">
          Validando tu elección…
        </p>
      )}
    </section>
  );
};

PhonePickerStep.propTypes = {
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  onPick: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
};

PhonePickerStep.defaultProps = {
  loading: false,
  error: null,
};

export default memo(PhonePickerStep);
