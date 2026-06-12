import React, { memo } from "react";
import { MdWarning } from "react-icons/md";
import styles from "../../LoanSimScreen.module.css";

const DeviceMismatchStep = () => {
  return (
    <div className={styles.calculatorMainBox}>
      <div className={styles.calculatorContainer}>
        <div style={{ textAlign: "center", padding: "32px 16px" }}>
          <MdWarning size={64} color="#d32f2f" style={{ marginBottom: "16px" }} />
          <h2 className={styles.title}>Dispositivo diferente detectado</h2>
          <p
            style={{
              fontSize: "16px",
              lineHeight: 1.5,
              margin: "16px 0",
              color: "#555",
            }}
          >
            Detectamos que estás intentando acceder desde un dispositivo diferente al que usaste
            para registrarte.
          </p>
          <p
            style={{
              fontSize: "16px",
              lineHeight: 1.5,
              margin: "16px 0",
              color: "#555",
            }}
          >
            Por favor, póngase en contacto con un operador para continuar con tu solicitud.
          </p>
        </div>
      </div>
    </div>
  );
};

export default memo(DeviceMismatchStep);
