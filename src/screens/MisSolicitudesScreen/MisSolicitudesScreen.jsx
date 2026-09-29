import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header, Footer } from "../../Components/index.js";
import authService from "../../services/authService.js";
import { setCookieWithDuration } from "../../lib/utils.js";
import { COOKIE_LEAD_TOKEN_CONFIG } from "../../constants/LOAN_SIM.js";
import { resolveEstado } from "./resolveEstado.js";
import styles from "./MisSolicitudesScreen.module.css";

/* ── Helpers de formato ───────────────────────────────────────────── */
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatCurrency(value) {
  if (value == null) return null;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

const BADGE_CLASS = {
  success: styles.badgeSuccess,
  warning: styles.badgeWarning,
  danger: styles.badgeDanger,
  neutral: styles.badgeNeutral,
};

/* ── Tarjeta de solicitud ────────────────────────────────────────── */
function SolicitudCard({ solicitud, onRetomar, retomando }) {
  const estado = resolveEstado(solicitud);
  const { prestamo } = solicitud;

  return (
    <div className={styles.card}>
      {/* Encabezado: nro + badge + fecha */}
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <span className={styles.cardRef}>Solicitud #{solicitud.id}</span>
          <span className={`${styles.badge} ${BADGE_CLASS[estado.tipo]}`}>
            {estado.label}
          </span>
        </div>
        <span className={styles.cardDate}>
          {formatDate(solicitud.fechaSolicitud)}
        </span>
      </div>

      {/* Descripción del estado */}
      {estado.tipo === "danger" ? (
        <p className={styles.estadoDesc}>
          Tu solicitud no ha sido aprobada.{" "}
          {estado.retryDate
            ? `Podés volver a intentarlo a partir del ${formatDate(estado.retryDate.toISOString())}.`
            : "Comunicarte con un asesor para más información."}
        </p>
      ) : estado.descripcion ? (
        <p className={styles.estadoDesc}>{estado.descripcion}</p>
      ) : null}

      {/* Botón Retomar — solo para solicitudes incompletas */}
      {estado.label === "Solicitud incompleta" && onRetomar && (
        <button
          type="button"
          className={styles.retakeBtn}
          onClick={() => onRetomar(solicitud.id)}
          disabled={retomando}
        >
          {retomando ? "Cargando…" : "Retomar solicitud →"}
        </button>
      )}

      {/* Detalle del préstamo (si existe) */}
      {prestamo &&
        (prestamo.capitalSeleccionado ||
          prestamo.cuota ||
          prestamo.plazoSeleccionado) && (
          <div className={styles.loanDetail}>
            {prestamo.capitalSeleccionado != null && (
              <div className={styles.loanItem}>
                <span className={styles.loanLabel}>Monto</span>
                <span className={styles.loanValue}>
                  {formatCurrency(prestamo.capitalSeleccionado)}
                </span>
              </div>
            )}
            {prestamo.cuota != null && (
              <div className={styles.loanItem}>
                <span className={styles.loanLabel}>Cuota</span>
                <span className={styles.loanValue}>
                  {formatCurrency(prestamo.cuota)}
                </span>
              </div>
            )}
            {prestamo.plazoSeleccionado != null && (
              <div className={styles.loanItem}>
                <span className={styles.loanLabel}>Plazo</span>
                <span className={styles.loanValue}>
                  {prestamo.plazoSeleccionado} meses
                </span>
              </div>
            )}
          </div>
        )}
    </div>
  );
}

/* ── Estado vacío ─────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon}>📋</span>
      <h2>Todavía no tenés solicitudes</h2>
      <p>
        Cuando completes el proceso de onboarding y simulación, tu historial de
        solicitudes va a aparecer acá.
      </p>
      <div className={styles.emptyAction}>
        <Link to="/" className="primary-btn">
          Quiero mi préstamo
        </Link>
      </div>
    </div>
  );
}

/* ── Pantalla ─────────────────────────────────────────────────────── */
const MisSolicitudesScreen = () => {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retomando, setRetomando] = useState(false);
  const [retomandoError, setRetomandoError] = useState("");

  useEffect(() => {
    authService
      .getSolicitudes()
      .then(({ solicitudes: data }) => setSolicitudes(data ?? []))
      .catch((err) =>
        setError(err.message || "No pudimos cargar tus solicitudes."),
      )
      .finally(() => setLoading(false));
  }, []);

  const handleRetomar = async (_solicitudId) => {
    setRetomando(true);
    setRetomandoError("");
    try {
      const result = await authService.resumeSolicitud();
      // Guardar el leadToken en cookie para que el flujo de onboarding lo lea
      await setCookieWithDuration(
        COOKIE_LEAD_TOKEN_CONFIG.NAME,
        result.data.leadToken,
        COOKIE_LEAD_TOKEN_CONFIG.EXPIRY_MS,
      );
      navigate("/registro-simulador");
    } catch (err) {
      setRetomandoError(
        err.message || "No pudimos retomar la solicitud. Intentá de nuevo.",
      );
    } finally {
      setRetomando(false);
    }
  };

  return (
    <>
      <Header />
      <main className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.heading}>
            <h1>Mis solicitudes</h1>
            <p>El historial de tus pedidos de préstamo en COFA.</p>
          </div>

          {loading && (
            <p className={styles.loading}>Cargando tus solicitudes…</p>
          )}

          {!loading && error && (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>⚠️</span>
              <h2>Algo salió mal</h2>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && solicitudes.length === 0 && <EmptyState />}

          {retomandoError && (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>⚠️</span>
              <p>{retomandoError}</p>
            </div>
          )}

          {!loading && !error && solicitudes.length > 0 && (
            <div className={styles.list}>
              {solicitudes.map((s) => (
                <SolicitudCard
                  key={s.id}
                  solicitud={s}
                  onRetomar={handleRetomar}
                  retomando={retomando}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default MisSolicitudesScreen;
