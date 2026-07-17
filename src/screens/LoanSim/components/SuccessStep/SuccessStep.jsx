import React, { useEffect, useState, lazy, Suspense } from "react";
import styles from "./SuccessStep.module.css";
import { MdCheckCircleOutline } from "react-icons/md";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import { COOKIE_CONFIG, UI_CONFIG } from "../../../../constants/LOAN_SIM.js";
import { getCookie } from "../../../../lib/utils.js";

const LoanInfoModal = lazy(() => import("../LoanInfoModal/LoanInfoModal.jsx"));

const SuccessStep = ({ handleInfoPrestamo, loanInfo, loadingModal, simulationData }) => {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [twoHourDurationCookie, setTwoHourDurationCookie] = useState(null);
  const onInfoPrestamo = async () => {
    const success = await handleInfoPrestamo();
    if (success) {
      setShowInfoModal(true);
    }
  };

  useEffect(() => {
    const checkCookie = async () => {
      const value = await getCookie(COOKIE_CONFIG.NAME);
      setTwoHourDurationCookie(value);
    };
    checkCookie();
  }, []);

  return (
    <div className={styles.container}>
      <MdCheckCircleOutline className={styles.icon} />
      <h2 className={styles.title}>¡Solicitud Exitosa!</h2>
      <p className={styles.description}>
        Hemos validado tus datos correctamente y el préstamo ha sido generado. 
        Revisa tu email para verificar que recibiste el contrato.
      </p>
      <div className={styles.buttonContainer}>
        <button
          className={`primary-btn ${loadingModal || !twoHourDurationCookie ? styles.disabled : ""}`}
          onClick={onInfoPrestamo}
          disabled={loadingModal || !twoHourDurationCookie}
          style={{ flex: 1 }}
          aria-label='Info prestamo'
        >
          {loadingModal ? "Cargando..." : "Info prestamo"}
        </button>
        <GenericButton
          type='button'
          variant='secondary'
          onClick={() => (window.location.href = "http://wa.me/5491137570853")}
          style={{ flex: 1 }}
        >
          Comunicarse con un asesor
        </GenericButton>
      </div>
      {showInfoModal && (
        <Suspense fallback={<div>Cargando detalle...</div>}>
          <LoanInfoModal
            loanInfo={loanInfo}
            closeModal={() => setShowInfoModal(false)}
            simulationData={simulationData}
          />
        </Suspense>
      )}
    </div>
  );
};

export default SuccessStep;
