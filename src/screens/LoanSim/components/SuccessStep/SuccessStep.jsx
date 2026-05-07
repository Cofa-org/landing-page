import React, { useEffect, useState } from "react";
import styles from "./SuccessStep.module.css";
import { MdCheckCircleOutline } from "react-icons/md";
import { COOKIE_CONFIG, UI_CONFIG } from "../../../../constants/LOAN_SIM.js";
import LoanInfoModal from "../LoanInfoModal/LoanInfoModal.jsx";
import { getCookie } from "../../../../lib/utils.js";

const SuccessStep = ({ handleInfoPrestamo, loanInfo, loadingModal }) => {
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
        Hemos validado tus datos correctamente y el prestamo ha sido generado. La transferencia esta
        en curso.
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
        <button
          className='primary-btn'
          onClick={() => (window.location.href = "http://wa.me/5491137570853")}
          style={{ flex: 1 }}
        >
          Comunicarse con asesor
        </button>
      </div>
      {showInfoModal && (
        <LoanInfoModal
          loanInfo={loanInfo}
          closeModal={() => setShowInfoModal(false)}
        />
      )}
    </div>
  );
};

export default SuccessStep;
