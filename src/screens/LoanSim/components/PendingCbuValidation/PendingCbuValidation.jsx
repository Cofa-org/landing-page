import React, { memo } from "react";
import PropTypes from "prop-types";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import styles from "./PendingCbuValidation.module.css";

const TITLE_ID = "pending-cbu-validation-title";
const SUBTITLE_ID = "pending-cbu-validation-subtitle";

/**
 * Pantalla de espera de la validación manual del CBU/CVU.
 * Plan 2026-10-20.
 *
 * Componente 100% presentacional: toda la lógica vive en
 * `useLoanSimulator` / `usePendingCbuValidation`.
 */
const PendingCbuValidation = ({ onContactAdvisor, onVerificarEstado, loading, error }) => {
  return (
    <section
      className={styles.container}
      aria-labelledby={TITLE_ID}
      aria-describedby={SUBTITLE_ID}
      data-testid="pending-cbu-validation"
    >
      <header className={styles.header}>
        <span className={styles.eyebrow} aria-hidden="true">
          Validación en curso
        </span>
        <h2 id={TITLE_ID} className={styles.title}>
          Estamos validando tu cuenta bancaria
        </h2>
        <p id={SUBTITLE_ID} className={styles.subtitle}>
          Un asesor está revisando el CBU/CVU que ingresaste. Apenas termine la
          validación vas a poder continuar con tu simulación.
        </p>
      </header>

      {/* La pantalla es un dead-end: si el refresh de la simulación falla (el
          caso más probable es `SIMULADOR_SIMULATION_EXPIRED`, a las 24h) el
          lead tiene que enterarse. `role="alert"` hace que el mensaje se
          anuncie apenas aparece (aria-live assertive). */}
      {error && (
        <p
          className={styles.errorText}
          role="alert"
          data-testid="pending-cbu-error"
        >
          {error}
        </p>
      )}

      <div className={styles.actionContainer}>
        <GenericButton
          variant="primary"
          onClick={onContactAdvisor}
          data-testid="pending-cbu-contact-button"
        >
          Comunicarse con un asesor
        </GenericButton>
        <GenericButton
          variant="secondary"
          onClick={onVerificarEstado}
          loading={loading}
          // `GenericButton` reemplaza el children por un spinner `aria-hidden`
          // cuando entra en loading → el botón quedaría sin nombre accesible.
          // El `aria-label` mantiene el nombre y el `aria-busy` expone el
          // estado "ocupado" (además sirve de hook para el CSS del spinner).
          aria-label="Verificar estado"
          aria-busy={loading || undefined}
          data-testid="pending-cbu-verificar-button"
        >
          Verificar estado
        </GenericButton>
      </div>
    </section>
  );
};

PendingCbuValidation.propTypes = {
  onContactAdvisor: PropTypes.func.isRequired,
  onVerificarEstado: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  // Mensaje de error que llega desde `useLoanSimulator` (ya formateado y
  // legible para el usuario). `null` = sin error.
  error: PropTypes.string,
};

PendingCbuValidation.defaultProps = {
  loading: false,
  error: null,
};

export default memo(PendingCbuValidation);
