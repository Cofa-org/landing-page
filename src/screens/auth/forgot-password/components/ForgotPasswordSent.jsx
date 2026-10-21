import { Link } from "react-router-dom";
import GenericForm from "../../../../Components/Forms/GenericForm/GenericForm.jsx";
import AuthSplitLayout from "../../AuthSplitLayout.jsx";
import styles from "../../auth.module.css";

const ForgotPasswordSent = () => (
  <AuthSplitLayout
    title="Seguridad ante todo"
    sub="Tu información está protegida. El link de recuperación expira en 20 minutos."
    image="/img/security-bank-encryption.webp"
  >
    <GenericForm title="Revisá tu bandeja de entrada">
      <p className={`${styles.alert} ${styles.alertSuccess}`}>
        Si el email está registrado, te enviamos un mail para continuar.
        Si todavía no confirmaste la cuenta, llega un código de 6 dígitos.
        Si ya está verificada, un link para restablecer la contraseña.
        <br />
        <br />
        El mail vence en <strong>20 minutos</strong>.
      </p>
      <p className={`${styles.auxLink} ${styles.alertSpaced}`}>
        <Link to="/ingresar">Volver a ingresar</Link>
      </p>
    </GenericForm>
  </AuthSplitLayout>
);

export default ForgotPasswordSent;
