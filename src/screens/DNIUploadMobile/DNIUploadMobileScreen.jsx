import DniCapture from "../../Components/DniCapture/DniCapture.jsx";
import CameraCapture from "./components/CameraCapture/CameraCapture.jsx";
import GenericForm from "../../Components/Forms/GenericForm/GenericForm.jsx";
import { useDniUploadMobileScreen } from "./hooks/useDniUploadMobileScreen.js";
import styles from "./DNIUploadMobile.module.css";

const DNIUploadMobileScreen = () => {
  const { viewModel, cameraProps, handleBack } = useDniUploadMobileScreen();
  if (viewModel.received) {
    return (
      <main className={styles.container}>
        <GenericForm title="Recibimos tus fotos" className={styles.confirmation}>
          <p role="status">Volvé a la PC para continuar con tu solicitud.</p>
        </GenericForm>
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
