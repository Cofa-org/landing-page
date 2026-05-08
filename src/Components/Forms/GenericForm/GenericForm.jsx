import React from "react";
import PropTypes from "prop-types";
import styles from "./GenericForm.module.css";
import BackButton from "../../buttons/backbutton/BackButton.jsx";

/**
 * GenericForm component.
 * Acts as a container for forms, providing consistent layout and styling.
 */
const GenericForm = ({ title, description, children, onSubmit, className = "", style = {} }) => {
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
