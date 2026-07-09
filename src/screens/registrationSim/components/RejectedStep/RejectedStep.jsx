import { UI_CONFIG } from "../../../../constants/LOAN_SIM.js";
import styles from "./RejectedStep.module.css";

const RejectedStep = () => {
  return (
    <div className={styles.container}>
      <img src="/img/rejected_empathy.webp" alt="Ilustración de rechazo" className={styles.illustration} />
      <h2 className={styles.title}>En este momento no podemos ofrecerte una solución.</h2>
      <p cla  ssName={styles.description}>
        Pero seguiremos buscando alternativas para apoyarte en tu camino hacia el éxito financiero.
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

export default RejectedStep;
