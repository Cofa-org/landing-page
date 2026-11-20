import { useEffect, useRef } from "react";
import { FiCheckCircle } from "react-icons/fi";
import DniCapture from "../../Components/DniCapture/DniCapture.jsx";
import CameraCapture from "./components/CameraCapture/CameraCapture.jsx";
import { useDniUploadMobileScreen } from "./hooks/useDniUploadMobileScreen.js";
import styles from "./DNIUploadMobile.module.css";

const DNIUploadMobileScreen = () => {
  const { viewModel, cameraProps, handleBack } = useDniUploadMobileScreen();
  const receivedHeading = useRef(null);
  const { received } = viewModel;

  useEffect(() => {
    if (received) receivedHeading.current?.focus();
  }, [received]);

  if (received) {
    return (
      <main className={styles.container}>
        <section className={styles.confirmation} aria-labelledby="dni-received-title">
          <span className={styles.confirmationIcon}><FiCheckCircle aria-hidden="true" /></span>
          <h1 id="dni-received-title" ref={receivedHeading} tabIndex={-1} aria-describedby="dni-received-message">¡Fotos enviadas!</h1>
          <p id="dni-received-message" role="status">
            Ya recibimos las fotos de tu DNI.<br />
            {" "}Volvé a la computadora para continuar con tu solicitud.
          </p>
        </section>
      </main>
    );
  }
  return (
    <main className={styles.container}>
      <button type="button" className={styles.backButton} onClick={handleBack}>Volver al registro</button>
      <DniCapture viewModel={viewModel} />
      <CameraCapture {...cameraProps} />
    </main>
  );
};
export default DNIUploadMobileScreen;
