import { useState } from "react";
import { Header, Footer } from "../../Components/index.js";
import GenericButton from "../../Components/buttons/GenericButton/GenericButton.jsx";
import PasswordInput from "../../Components/Forms/GenericInput/PasswordInput.jsx";
import GenericInput from "../../Components/Forms/GenericInput/GenericInput.jsx";
import { useAuth } from "../../context/index.js";
import authService from "../../services/authService.js";
import PerfilTabs from "./PerfilTabs.jsx";
import styles from "./MiPerfilScreen.module.css";

function CambiarContrasena() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading]                 = useState(false);
  const [success, setSuccess]                 = useState("");
  const [error, setError]                     = useState("");

  const canSubmit =
    !loading &&
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await authService.changePassword(currentPassword, newPassword);
      setSuccess(res.message || "Contraseña actualizada.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "No pudimos actualizar la contraseña. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.card} ${styles.passwordCard}`}>
      <div className={styles.cardHeader}><h2>Cambiar contraseña</h2></div>
      <div className={styles.cardBody}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <PasswordInput
            label="Contraseña actual"
            name="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <PasswordInput
            label="Nueva contraseña"
            name="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
            helperText="Mínimo 8 caracteres."
          />
          <PasswordInput
            label="Confirmar nueva contraseña"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
            error={
              confirmPassword && newPassword !== confirmPassword
                ? "Las contraseñas no coinciden."
                : ""
            }
          />
          {error   && <p className={`${styles.alert} ${styles.alertError}`}>{error}</p>}
          {success && <p className={`${styles.alert} ${styles.alertSuccess}`}>{success}</p>}
          <div className={styles.formActions}>
            <GenericButton type="submit" loading={loading} disabled={!canSubmit}>
              Actualizar contraseña
            </GenericButton>
          </div>
        </form>
      </div>
    </div>
  );
}

function CambiarEmail({ onEmailChanged }) {
  const [step, setStep]                       = useState("form");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail]               = useState("");
  const [code, setCode]                       = useState("");
  const [loading, setLoading]                 = useState(false);
  const [success, setSuccess]                 = useState("");
  const [error, setError]                     = useState("");

  const handleRequestChange = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.requestEmailChange(currentPassword, newEmail);
      setStep("otp");
    } catch (err) {
      setError(err.message || "No pudimos procesar el cambio. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authService.confirmEmailChange(code);
      setSuccess(res.message || "Email actualizado. Vas a ser desconectado.");
      setTimeout(() => onEmailChanged(), 2500);
    } catch (err) {
      setError(err.message || "El código es inválido o expiró. Pedí uno nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "otp") {
    return (
      <div className={`${styles.card} ${styles.emailCard}`}>
        <div className={styles.cardHeader}><h2>Cambiar email — Confirmar</h2></div>
        <div className={styles.cardBody}>
          {success ? (
            <p className={`${styles.alert} ${styles.alertSuccess}`}>{success}</p>
          ) : (
            <form className={styles.form} onSubmit={handleConfirm}>
              <p className={styles.otpHint}>
                Te enviamos un código de 6 dígitos a <strong>{newEmail}</strong>. Ingresalo para confirmar el cambio.
              </p>
              <GenericInput
                label="Código de verificación"
                name="code"
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                required
              />
              {error && <p className={`${styles.alert} ${styles.alertError}`}>{error}</p>}
              <div className={styles.formActions}>
                <GenericButton type="submit" loading={loading} disabled={loading || code.length !== 6}>
                  Confirmar nuevo email
                </GenericButton>
                <GenericButton
                  type="button"
                  variant="secondary"
                  onClick={() => { setStep("form"); setError(""); setCode(""); }}
                >
                  Volver
                </GenericButton>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.card} ${styles.emailCard}`}>
      <div className={styles.cardHeader}><h2>Cambiar email</h2></div>
      <div className={styles.cardBody}>
        <form className={styles.form} onSubmit={handleRequestChange}>
          <PasswordInput
            label="Contraseña actual"
            name="currentPasswordEmail"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <GenericInput
            label="Nuevo email"
            name="newEmail"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="nuevo@email.com"
            required
          />
          {error && <p className={`${styles.alert} ${styles.alertError}`}>{error}</p>}
          <div className={styles.formActions}>
            <GenericButton
              type="submit"
              loading={loading}
              disabled={loading || !currentPassword || !newEmail.trim()}
            >
              Enviar código de verificación
            </GenericButton>
          </div>
        </form>
      </div>
    </div>
  );
}

const ConfiguracionScreen = () => {
  const { logout } = useAuth();

  const handleEmailChanged = async () => {
    await logout();
  };

  return (
    <>
      <Header />
      <main className={styles.page}>
        <div className={`${styles.inner} ${styles.innerConfig}`}>
          <div className={styles.heading}>
            <h1>Configuración</h1>
            <p>Cambiá tu contraseña o tu email.</p>
            <PerfilTabs />
          </div>

          <CambiarContrasena />
          <CambiarEmail onEmailChanged={handleEmailChanged} />
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ConfiguracionScreen;
