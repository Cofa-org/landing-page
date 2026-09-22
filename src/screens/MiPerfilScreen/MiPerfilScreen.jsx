import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header, Footer } from "../../Components/index.js";
import GenericButton from "../../Components/buttons/GenericButton/GenericButton.jsx";
import PasswordInput from "../../Components/Forms/GenericInput/PasswordInput.jsx";
import GenericInput from "../../Components/Forms/GenericInput/GenericInput.jsx";
import { useAuth } from "../../context/index.js";
import authService from "../../services/authService.js";
import styles from "./MiPerfilScreen.module.css";

/* ── Helpers ──────────────────────────────────────────────────────── */
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/* ── Sección: Información de cuenta ──────────────────────────────── */
function InfoCuenta({ user }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}><h2>Información de cuenta</h2></div>
      <div className={styles.cardBody}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Email</span>
          <span className={styles.infoValue}>{user?.email ?? "—"}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Miembro desde</span>
          <span className={styles.infoValue}>{formatDate(user?.fechaCreacion)}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Sección: Mis solicitudes (resumen) ───────────────────────────── */
function SolicitudesResumen() {
  const [count, setCount]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService
      .getSolicitudes()
      .then(({ solicitudes }) => setCount(solicitudes?.length ?? 0))
      .catch(() => setCount(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}><h2>Mis solicitudes</h2></div>
      <div className={styles.cardBody}>
        <div className={styles.solicitudesRow}>
          <span className={styles.solicitudesText}>
            {loading
              ? "Cargando…"
              : count === null
                ? "No pudimos cargar tus solicitudes."
                : count === 0
                  ? "Todavía no tenés solicitudes activas."
                  : `Tenés ${count} solicitud${count !== 1 ? "es" : ""} registrada${count !== 1 ? "s" : ""}.`}
          </span>
          {!loading && count !== null && (
            <Link to="/mis-solicitudes" className={styles.solicitudesLink}>
              {count > 0 ? "Ver todas →" : "Quiero mi préstamo →"}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sección: Cambiar contraseña ──────────────────────────────────── */
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
    <div className={styles.card}>
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

/* ── Sección: Cambiar email ───────────────────────────────────────── */
function CambiarEmail({ onEmailChanged }) {
  // step: 'form' | 'otp'
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
      // Notifica al padre para cerrar sesión / actualizar contexto
      setTimeout(() => onEmailChanged(), 2500);
    } catch (err) {
      setError(err.message || "El código es inválido o expiró. Pedí uno nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "otp") {
    return (
      <div className={styles.card}>
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
    <div className={styles.card}>
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

/* ── Pantalla principal ───────────────────────────────────────────── */
const MiPerfilScreen = () => {
  const { user, logout } = useAuth();

  const handleEmailChanged = async () => {
    await logout();
  };

  return (
    <>
      <Header />
      <main className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.heading}>
            <h1>Mi perfil</h1>
            <p>Administrá tu cuenta y revisá tus solicitudes.</p>
          </div>

          <InfoCuenta user={user} />
          <SolicitudesResumen />
          <CambiarContrasena />
          <CambiarEmail onEmailChanged={handleEmailChanged} />
        </div>
      </main>
      <Footer />
    </>
  );
};

export default MiPerfilScreen;
