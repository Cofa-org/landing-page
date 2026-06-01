import React, { memo } from "react";
import PropTypes from "prop-types";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import styles from "./WelcomeStep.module.css";

const WelcomeStep = ({ onBack, onComplete }) => {
  const handleBack = () => onBack && onBack();
  const handleComplete = () => onComplete && onComplete();

  return (
    <div className={styles.container}>
      {/* <div className={styles.content}> */}
        <h1 className={styles.title}>Bienvenido a Cofa!</h1>
        <p className={styles.subtitle}>
          Tu registro fue completado exitosamente.
        </p>
        <GenericButton onClick={handleComplete}>
          Quiero mi préstamo
        </GenericButton>
      {/* </div> */}
    </div>
  );
};

WelcomeStep.propTypes = {
  onBack: PropTypes.func,
  onComplete: PropTypes.func,
};

export default memo(WelcomeStep);