import React from "react";
import { MdPersonOff } from "react-icons/md";
import { UI_CONFIG } from "../../../../constants/LOAN_SIM.js";
import styles from "./RejectedStep.module.css";

const RejectedStep = () => {
  return (
    <div className={styles.container}>
      <MdPersonOff className={styles.icon} />
      <h2 className={styles.title}>Lo sentimos.</h2>
      <p className={styles.description}>
        En estos momentos no tenemos un préstamo para ofrecerte.
      </p>
      <p className={styles.subdescription}>
        Esto no significa que no puedas volver a intentarlo en el futuro.
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
