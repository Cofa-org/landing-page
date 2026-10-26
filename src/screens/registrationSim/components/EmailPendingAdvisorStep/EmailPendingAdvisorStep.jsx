import React, { memo } from "react";
import PropTypes from "prop-types";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import styles from "./EmailPendingAdvisorStep.module.css";

const TITLE_ID = "email-pending-advisor-title";
const SUBTITLE_ID = "email-pending-advisor-subtitle";

const EmailPendingAdvisorStep = ({
  onContactAdvisor,
  onVerificarEstado,
  loading = false,
  error = null,
  status = null,
}) => {
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
          Para continuar, necesitamos actualizar tu correo electrónico. Hablá con un asesor. Cuando te
          confirme que podés continuar, presioná <b>Verificar estado</b>.
        </p>
      </header>

      {error && (
        <p className={styles.errorText} role='alert'>
          {error}
        </p>
      )}
      {status && (
        <p className={styles.statusText} role='status'>
          {status}
        </p>
      )}

      <div className={styles.actionContainer}>
        <GenericButton
          variant='primary'
          onClick={onContactAdvisor}
          data-testid='email-pending-advisor-contact-button'
        >
          Hablar con un asesor
        </GenericButton>
        <GenericButton
          variant='secondary'
          onClick={onVerificarEstado}
          loading={loading}
          aria-label='Verificar estado'
          aria-busy={loading || undefined}
          data-testid='email-pending-advisor-verificar-button'
        >
          Verificar estado
        </GenericButton>
      </div>
    </section>
  );
};

EmailPendingAdvisorStep.propTypes = {
  onContactAdvisor: PropTypes.func.isRequired,
  onVerificarEstado: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  status: PropTypes.string,
};

export default memo(EmailPendingAdvisorStep);
