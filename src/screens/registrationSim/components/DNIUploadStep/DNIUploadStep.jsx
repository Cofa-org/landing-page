import { memo } from "react";
import PropTypes from "prop-types";
import DniCapture from "../../../../Components/DniCapture/DniCapture.jsx";
import CameraCapture from "../../../DNIUploadMobile/components/CameraCapture/CameraCapture.jsx";
import { useDniUploadStep } from "../../hooks/useDniUploadStep.js";
import styles from "./DNIUploadStep.module.css";

const DNIUploadStep = props => {
  const { viewModel, cameraProps } = useDniUploadStep(props);
  return (
    <div className={styles.container}>
      <DniCapture viewModel={viewModel} />
      <CameraCapture {...cameraProps} />
    </div>
  );
};
DNIUploadStep.propTypes = {
  leadId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  leadToken: PropTypes.string, onSuccess: PropTypes.func, loading: PropTypes.bool, error: PropTypes.string,
};
export default memo(DNIUploadStep);
