import React, { useEffect, useState, lazy, Suspense } from "react";
import styles from "./SuccessStep.module.css";
import { MdCheckCircleOutline } from "react-icons/md";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import { COOKIE_LOAN_INFO_CONFIG } from "../../../../constants/LOAN_SIM.js";
import { getCookie } from "../../../../lib/utils.js";

const LoanInfoModal = lazy(() => import("../LoanInfoModal/LoanInfoModal.jsx"));

const SuccessStep = ({ handleInfoPrestamo, loanInfo, loadingModal, simulationData }) => {
  const [showInfoModal, setShowInfoModal] = useState(false);
  // Regla de negocio: el usuario tiene 2h para ver la información del préstamo.
  // El botón debe quedar deshabilitado una vez que la cookie expira.
  // Re-check periódico (cada 30s) para reflejar la expiración sin refresh.
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkCookie = async () => {
      const value = await getCookie(COOKIE_LOAN_INFO_CONFIG.NAME);
      setHasAccess(!!value);
    };
    checkCookie();
    const interval = setInterval(checkCookie, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  const onInfoPrestamo = async () => {
    // Re-check fresco en el momento del click para evitar mostrar el modal
    // si la cookie expiró entre el último interval y este click.
    const cached = await getCookie(COOKIE_LOAN_INFO_CONFIG.NAME);
    if (!cached) {
      setHasAccess(false);
      return;
    }
    const success = await handleInfoPrestamo();
    if (success) {
      setShowInfoModal(true);
    }
  };

  return (
    <div className={styles.container}>
      <MdCheckCircleOutline className={styles.icon} />
      <h2 className={styles.title}>¡Solicitud Exitosa!</h2>
      <p className={styles.description}>
        Hemos validado tus datos correctamente y el préstamo ha sido generado.
        Revisa tu email para verificar que recibiste el contrato.
      </p>
      <p className={styles.description}>
        Tenés 2 horas para consultar la información de tu préstamo. Pasado ese
        tiempo, comunicate con un asesor.
      </p>
      <div className={styles.buttonContainer}>
        <GenericButton
          type='button'
          variant='primary'
          onClick={onInfoPrestamo}
          disabled={!hasAccess}
          loading={loadingModal}
          style={{ flex: 1 }}
          aria-label='Informacion prestamo'
        >
          INFORMACIÓN PRÉSTAMO
        </GenericButton>
        {/* <GenericButton
          type='button'
          variant='secondary'
          onClick={() => (window.location.href = "http://wa.me/5491137570853")}
          style={{ flex: 1 }}
        >
          Comunicarse con un asesor
        </GenericButton> */}
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