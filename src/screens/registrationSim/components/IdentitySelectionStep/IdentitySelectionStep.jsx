import React, { memo } from "react";
import PropTypes from "prop-types";
import styles from "./IdentitySelectionStep.module.css";

const formatCuit = (cuit) => {
  const s = String(cuit);
  if (s.length !== 11) return s;
  return `${s.slice(0, 2)}-${s.slice(2, 10)}-${s.slice(10)}`;
};

const IdentitySelectionStep = ({ identities, onSelect, onBack, loading, error }) => {
  const handleClick = async (cuit) => {
    if (loading) return;
    await onSelect(String(cuit));
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Encontramos más de una persona con tu DNI</h2>
      <p className={styles.subtitle}>
        Elegí la persona correcta para continuar con tu solicitud.
      </p>
      <div className={styles.list}>
        {identities.map((identity) => (
          <button
            key={identity.cuit}
            type="button"
            className={styles.card}
            onClick={() => handleClick(identity.cuit)}
            disabled={loading}
          >
            <div>{identity.nombreCompleto}</div>
            <div className={styles.cardCuit}>CUIT {formatCuit(identity.cuit)}</div>
          </button>
        ))}
      </div>
      {error && <p className={styles.error}>{error} 😊</p>}
      <button
        type="button"
        className={styles.backButton}
        onClick={onBack}
        disabled={loading}
      >
        ← Volver
      </button>
      {loading && (
        <button type="button" disabled>
          Procesando...
        </button>
      )}
    </div>
  );
};

IdentitySelectionStep.propTypes = {
  identities: PropTypes.arrayOf(
    PropTypes.shape({
      cuit: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      nombreCompleto: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
};

IdentitySelectionStep.defaultProps = {
  loading: false,
  error: null,
};

export default memo(IdentitySelectionStep);
