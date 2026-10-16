import React, { memo } from "react";
import PropTypes from "prop-types";
import GenericButton from "../../../../components/buttons/GenericButton/GenericButton.jsx";
import styles from "./EmailPendingAdvisorStep.module.css";

const TITLE_ID = "email-pending-advisor-title";
const SUBTITLE_ID = "email-pending-advisor-subtitle";

const EmailPendingAdvisorStep = ({ onContactAdvisor }) => {
  return (
    <section
      className={styles.container}
      aria-labelledby={TITLE_ID}
      aria-describedby={SUBTITLE_ID}
    >
      <header className={styles.header}>
        <span
          className={styles.eyebrow}
          aria-hidden='true'
        >
          Paso adicional
        </span>
        <h2
          id={TITLE_ID}
          className={styles.title}
        >
          Hablá con un asesor para continuar
        </h2>
        <p
          id={SUBTITLE_ID}
          className={styles.subtitle}
        >
          Para continuar, necesitamos actualizar tu correo electrónico. Hablá con un asesor.
        </p>
      </header>

      <div className={styles.actionContainer}>
        <GenericButton
          variant='primary'
          onClick={onContactAdvisor}
          data-testid='email-pending-advisor-contact-button'
        >
          Comunicarse con un asesor
        </GenericButton>
      </div>
    </section>
  );
};

EmailPendingAdvisorStep.propTypes = {
  onContactAdvisor: PropTypes.func.isRequired,
};

export default memo(EmailPendingAdvisorStep);
