import React, { memo } from "react";
import PropTypes from "prop-types";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import { useMobbexSubscription } from "../../hooks/useMobbexSubscription";
import styles from "./MobbexSubscriptionStep.module.css";

const MobbexSubscriptionStep = ({ scoringId, onSubscriptionCompleted, error: externalError }) => {
  const { isConfirming, loading, error, message, handleSuscribirse } = useMobbexSubscription(
    scoringId,
    onSubscriptionCompleted,
  );

  if (isConfirming) {
    return (
      <div className={styles.container}>
        <img
          src='/img/mobbex_confirming.webp'
          alt='Confirmando suscripción'
          className={styles.illustration}
        />
        <h2 className={styles.title}>Estamos confirmando tu suscripción!</h2>
        <p className={styles.description}>Aguarda unos segundos por favor...</p>
      </div>
    );
  }

  const displayError = error || externalError;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Suscribite al débito automático</h2>
      <p className={styles.description}>
        Para completar la solicitud de tu préstamo, suscribite al débito automático de tus cuotas a
        través de Mobbex. Serás redirigido a su plataforma para finalizar el proceso de forma
        segura.
      </p>
      <p className={styles.note}>
        Si la suscripción no se completa o falla, comunicate con un operador para finalizar tu
        préstamo.
      </p>
      {displayError && <p className={styles.errorText}>{displayError}</p>}
      {message && <p className={styles.infoText}>{message}</p>}
      <GenericButton
        onClick={handleSuscribirse}
        loading={loading}
        disabled={loading}
        className={styles.button}
      >
        Suscribirme en Mobbex
      </GenericButton>
      <GenericButton
        type='button'
        variant='secondary'
        onClick={() => window.open("https://wa.me/5491137570853", "_blank", "noopener,noreferrer")}
        style={{ flex: 1, marginTop: "1rem" }}
      >
        Comunicarse con un asesor
      </GenericButton>
    </div>
  );
};

MobbexSubscriptionStep.propTypes = {
  scoringId: PropTypes.string.isRequired,
  onSubscriptionCompleted: PropTypes.func.isRequired,
  error: PropTypes.string,
};

export default memo(MobbexSubscriptionStep);
