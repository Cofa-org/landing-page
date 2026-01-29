import React from "react";
import PropTypes from "prop-types";
import styles from "./GenericButton.module.css";

/**
 * GenericButton component.
 * Follows /react-ui-designer workflow: Functional, CSS Modules, PropTypes.
 */
const GenericButton = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  loading = false,
  className = "",
  ...props
}) => {
  const buttonClass = `
    ${styles.button} 
    ${styles[variant]} 
    ${disabled || loading ? styles.disabled : ""} 
    ${className}
  `.trim();

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={buttonClass}
      {...props}
    >
      {loading ? (
        <span
          className={styles.spinner}
          aria-hidden='true'
        ></span>
      ) : (
        children
      )}
    </button>
  );
};

GenericButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  variant: PropTypes.oneOf(["primary", "secondary", "outline"]),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  className: PropTypes.string,
};

export default GenericButton;
