import { Link } from "react-router-dom";
import GenericButton from "../../../Components/buttons/GenericButton/GenericButton.jsx";
import AuthSplitLayout from "../AuthSplitLayout.jsx";
import styles from "../auth.module.css";

const RegisterAlreadyRegisteredStep = ({ maskedEmail, onLogin, onBack }) => (
  <AuthSplitLayout
    title="Ya tenés cuenta"
    sub="Encontramos una cuenta asociada a tu identidad. Ingresá con tu email y contraseña."
  >
    <div style={{ width: "100%", maxWidth: "450px" }}>
      <h2 className={styles.formTitle}>Tu cuenta ya está activa</h2>
      <div className={styles.infoBox}>
        <p className={styles.infoBoxText}>
          Hay una cuenta verificada para{" "}
          <strong>{maskedEmail}</strong>. Si no recordás la
          contraseña, podés restablecerla.
        </p>
      </div>
      <div className={styles.formActions}>
        <GenericButton type="button" onClick={onLogin}>
          Ingresar
        </GenericButton>
        <p className={styles.auxLink}>
          <Link to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>
        </p>
        <button type="button" className={styles.backLink} onClick={onBack}>
          ← Volver
        </button>
      </div>
    </div>
  </AuthSplitLayout>
);

export default RegisterAlreadyRegisteredStep;
