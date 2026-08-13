import { UI_CONFIG } from "../../../../constants/LOAN_SIM.js";
import styles from "./RejectedStep.module.css";

const formatDate = (iso) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()}`;
};

const RejectedStep = ({ fechaExpiracionBloqueo = null }) => {
  const fechaTexto = fechaExpiracionBloqueo ? formatDate(fechaExpiracionBloqueo) : null;
  return (
    <div className={styles.container}>
      <img
        src="/img/rejected_empathy.webp"
        alt="Ilustración de rechazo"
        className={styles.illustration}
      />
      <h2 className={styles.title}>En este momento no podemos ofrecerte una solución.</h2>
      <p className={styles.description}>
        Pero seguiremos buscando alternativas para apoyarte en tu camino hacia el éxito financiero.
      </p>
      {fechaTexto && (
        <p className={styles.description} role="status">
          Podés volver a intentarlo a partir del <strong>{fechaTexto}</strong>.
        </p>
      )}
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
