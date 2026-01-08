import React from "react";
import styles from "./SuccessStep.module.css";
import { MdCheckCircleOutline } from "react-icons/md";
import { UI_CONFIG } from "../../../../constants/LOAN_SIM.js";

const SuccessStep = () => {
  return (
    <div className={styles.container}>
      <MdCheckCircleOutline className={styles.icon} />
      <h2 className={styles.title}>¡Solicitud Exitosa!</h2>
      <p className={styles.description}>
        Hemos validado tus datos correctamente. Un asesor se pondrá en contacto contigo a la
        brevedad.
      </p>
      <button
        className='primary-btn'
        onClick={() => (window.location.href = UI_CONFIG.HOME_URL)}
        style={{ marginTop: "20px" }}
      >
        Ir a la página principal
      </button>
    </div>
  );
};

export default SuccessStep;
