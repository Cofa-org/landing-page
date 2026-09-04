import React from "react";
import PropTypes from "prop-types";
import { MdWarningAmber } from "react-icons/md";
import styles from "./FraudWarning.module.css";

const FraudWarning = ({ checked, onChange, showCheckbox = true }) => {
  return (
    <div className={styles.warningContainer}>
      <div className={styles.warningHeader}>
        <MdWarningAmber className={styles.warningIcon} style={{ color: "#f57c00", fill: "#f57c00" }} size={24} />
        <span className={styles.warningTitle}>Importante - Evitá fraudes</span>
      </div>
      <p className={styles.warningText}>
        Estás iniciando una solicitud de préstamo con COFA. Este acceso debe haberte llegado por canales oficiales. COFA nunca te pedirá transferir el dinero del préstamo a otra persona ni te ofrecerá un monto mayor a cambio de hacerlo. Si alguien te indicó hacerlo, no continúes y contactanos por nuestros canales oficiales.
      </p>
      {showCheckbox && (
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className={styles.checkboxInput}
          />
          <span className={styles.checkboxText}>
            Entiendo esta advertencia, declaro que soy el beneficiario final del préstamo solicitado y que la solicitud la estoy realizando para mi propio beneficio.
          </span>
        </label>
      )}
    </div>
  );
};

FraudWarning.propTypes = {
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  showCheckbox: PropTypes.bool,
};

export default FraudWarning;
