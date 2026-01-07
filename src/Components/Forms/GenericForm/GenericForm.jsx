import React from "react";
import PropTypes from "prop-types";
import { MdArrowBack } from "react-icons/md";
import styles from "./GenericForm.module.css";

/**
 * GenericForm component.
 * Acts as a container for forms, providing consistent layout and styling.
 */
const GenericForm = ({ title, description, children, onSubmit, onBack, className = "", style = {} }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(e);
  };

  return (
    <form
      className={`${styles.form} ${className}`}
      style={style}
      onSubmit={handleSubmit}
    >
      {onBack && (
        <button
          type='button'
          className={styles.backButton}
          onClick={onBack}
          aria-label='Volver'
        >
          <MdArrowBack className={styles.backIcon} />
          <span>Volver</span>
        </button>
      )}
      {title && <h3 className={styles.title}>{title}</h3>}
      {description && <p className={styles.description}>{description}</p>}
      <div className={styles.content}>{children}</div>
    </form>
  );
};

GenericForm.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
  onSubmit: PropTypes.func,
  onBack: PropTypes.func,
  className: PropTypes.string,
  customStyle: PropTypes.object,
};

export default GenericForm;
