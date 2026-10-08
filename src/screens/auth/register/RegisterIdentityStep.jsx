import AuthSplitLayout from "../AuthSplitLayout.jsx";
import styles from "../auth.module.css";

const RegisterIdentityStep = ({ identities, onSelect, onBack }) => (
  <AuthSplitLayout
    title="Confirmá tu identidad"
    sub="Encontramos más de un registro para tu DNI. Seleccioná el que corresponde."
  >
    <div style={{ width: "100%", maxWidth: "450px" }}>
      <h2 className={styles.formTitle}>¿Cuál es tu CUIT?</h2>
      <p className={styles.formSubtitle}>
        Tu DNI tiene más de una identidad registrada en AFIP. Seleccioná la tuya.
      </p>
      <div className={styles.identityList}>
        {identities.map((identity) => (
          <button
            key={identity.cuit}
            type="button"
            className={styles.identityOption}
            onClick={() => onSelect(identity.cuit)}
          >
            <span className={styles.identityName}>
              {identity.nombreCompleto ?? "Sin nombre registrado"}
            </span>
            <span className={styles.identityCuit}>CUIT {identity.cuit}</span>
          </button>
        ))}
      </div>
      <button type="button" className={styles.backLink} onClick={onBack}>
        ← Volver a ingresar el DNI
      </button>
    </div>
  </AuthSplitLayout>
);

export default RegisterIdentityStep;
