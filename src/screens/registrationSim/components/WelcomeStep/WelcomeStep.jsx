import React, { memo } from "react";
import PropTypes from "prop-types";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import styles from "./WelcomeStep.module.css";
import { useWelcomeStep } from "../../hooks/useWelcomeStep.js";

const WelcomeStep = ({ leadId, onBack }) => {
  const handleBack = () => onBack && onBack();

  const { handleWelcomeComplete, onboardingCompletado, welcomeImage } =
    useWelcomeStep();

  return (
    <div className={styles.container}>
      <img
        src={welcomeImage}
        alt='Registro exitoso'
        className={styles.illustration}
      />
      <div className={styles.content}>
        <h1 className={styles.title}>Bienvenido a Cofa!</h1>
        <p className={styles.subtitle}>Tu registro fue completado exitosamente. Nuestro equipo ya ha sido notificado. A la brevedad uno de nuestros operadores se pondrá en contacto a tu celular para terminar.</p>
        <GenericButton
          onClick={() => handleWelcomeComplete(leadId)}
          disabled={onboardingCompletado}
        >
          Quiero mi préstamo
        </GenericButton>
      </div>
    </div>
  );
};

WelcomeStep.propTypes = {
  onBack: PropTypes.func,
  leadId: PropTypes.number,
};

export default memo(WelcomeStep);
