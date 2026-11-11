import DniCapture from "../../Components/DniCapture/DniCapture.jsx";
import CameraCapture from "./components/CameraCapture/CameraCapture.jsx";
import { useDniUploadMobileScreen } from "./hooks/useDniUploadMobileScreen.js";
import styles from "./DNIUploadMobile.module.css";

const DNIUploadMobileScreen = () => {
  const { viewModel, cameraProps, handleBack } = useDniUploadMobileScreen();
  return (
    <main className={styles.container}>
      <button type="button" className={styles.backButton} onClick={handleBack}>Volver al registro</button>
      <DniCapture viewModel={viewModel} />
      <CameraCapture {...cameraProps} />
    </main>
  );
};
export default DNIUploadMobileScreen;
