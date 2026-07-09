import { UI_CONFIG } from "../../../../constants/LOAN_SIM.js";
import styles from "./AnalysisStep.module.css";

const AnalysisStep = () => {
  return (
    <div className={styles.container}>
      <img src="/img/analysis_in_progress.webp" alt="Ilustración de análisis" className={styles.illustration} />
      <h2 className={styles.title}>Estamos analizando tu solicitud</h2>
      <p className={styles.description}>
        Pronto te contactaremos para ofrecerte la mejor opción.
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