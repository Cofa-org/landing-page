import { Link } from "react-router-dom";
import GenericForm from "../../../../Components/Forms/GenericForm/GenericForm.jsx";
import AuthSplitLayout from "../../AuthSplitLayout.jsx";
import { RESET_LAYOUT } from "../hooks/useResetPassword.js";
import styles from "../../auth.module.css";

const ResetPasswordInvalid = () => (
  <AuthSplitLayout {...RESET_LAYOUT}>
    <GenericForm title="Link inválido">
      <p className={`${styles.alert} ${styles.alertError}`}>
        El link de recuperación es inválido o expiró. Pedí uno nuevo.
      </p>
      <p className={`${styles.auxLink} ${styles.alertSpaced}`}>
        <Link to="/recuperar-contrasena">Pedir nuevo link</Link>
      </p>
    </GenericForm>
  </AuthSplitLayout>
);

export default ResetPasswordInvalid;
