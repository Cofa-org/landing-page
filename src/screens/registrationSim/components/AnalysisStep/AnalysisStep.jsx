import React from "react";
import { FaUserClock } from "react-icons/fa";
import { UI_CONFIG } from "../../../../constants/LOAN_SIM.js";
import styles from "./AnalysisStep.module.css";

const AnalysisStep = () => {
  return (
    <div className={styles.container}>
      <FaUserClock className={styles.icon} />
      <h2 className={styles.title}>Estamos analizando tu situación</h2>
      <p className={styles.description}>
        Para ofrecerte la mejor opción, un operador se pondrá en contacto contigo en breve.
      </p>
      <div className={styles.buttonContainer}>
        <a
          href={UI_CONFIG.HOME_URL}
          className="primary-btn"
          style={{ textAlign: "center" }}
        >
          Volver al inicio
        </a>
      </div>
    </div>
  );
};

export default AnalysisStep;