import PropTypes from "prop-types";
import styles from "./BackButton.module.css";
import { MdArrowBack } from "react-icons/md";

const BackButton = ({ onClick, disabled, loading }) => {
  return (
    <button
      type='button'
      className={styles.backButton}
      onClick={onClick}
      disabled={disabled || loading}
    >
      <MdArrowBack className={styles.backIcon} />
      <span>Volver</span>
    </button>
  );
};

BackButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
};

export default BackButton;
