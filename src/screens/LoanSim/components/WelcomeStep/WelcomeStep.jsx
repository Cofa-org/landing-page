import React, { memo } from "react";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import styles from "./WelcomeStep.module.css";

const WelcomeStep = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Bienvenido a Cofa!</h1>
        <p className={styles.subtitle}>
          Tu registro fue completado exitosamente.
        </p>
        <GenericButton
          onClick={() => window.open("http://wa.me/5491137570853", "_blank", "noopener,noreferrer")}
        >
          Quiero mi préstamo
        </GenericButton>
      </div>
    </div>
  );
};

export default memo(WelcomeStep);