import React, { useEffect, useState } from "react";
import styles from "./SuccessStep.module.css";
import { MdCheckCircleOutline } from "react-icons/md";
import { COOKIE_CONFIG, UI_CONFIG } from "../../../../constants/LOAN_SIM.js";
import LoanInfoModal from "../LoanInfoModal/LoanInfoModal.jsx";
import { use } from "react";

const SuccessStep = ({ handleInfoPrestamo, loanInfo, loadingModal }) => {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [dayDurationCookie, setDayDurationCookie] = useState(null);
  const onInfoPrestamo = async () => {
    const success = await handleInfoPrestamo();
    if (success) {
      setShowInfoModal(true);
    }
  };

  useEffect(() => {
    const getCookie = async () => {
      const cookie = await cookieStore.get(COOKIE_CONFIG.NAME);
      setDayDurationCookie(cookie);
    };
    getCookie();
  }, []);

  return (
    <div className={styles.container}>
      <MdCheckCircleOutline className={styles.icon} />
      <h2 className={styles.title}>¡Solicitud Exitosa!</h2>
      <p className={styles.description}>
        Hemos validado tus datos correctamente. Un asesor se pondrá en contacto contigo a la
        brevedad.
      </p>
      <div className={styles.buttonContainer}>
        <button
          className={`primary-btn ${loadingModal || !dayDurationCookie ? styles.disabled : ""}`}
          onClick={onInfoPrestamo}
          disabled={loadingModal || !dayDurationCookie}
          style={{ flex: 1 }}
          aria-label='Info prestamo'
        >
          {loadingModal ? "Cargando..." : "Info prestamo"}
        </button>
        <button
          className='primary-btn'
          onClick={() => (window.location.href = "/contacto")}
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
