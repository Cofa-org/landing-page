import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header, Footer } from "../../Components/index.js";
import authService from "../../services/authService.js";
import styles from "./MisSolicitudesScreen.module.css";

/* ── Mapeo de estados a etiqueta + tipo visual ─────────────────────── */
const ESTADO_BADGE = {
  ACEPTADO:   { label: "Aprobada",                                   tipo: "success"  },
  ANALIZAR:   { label: "En análisis",                                 tipo: "warning"  },
  RECHAZADO:  { label: "No pudimos avanzar con tu solicitud",         tipo: "danger"   },
  ABANDONADO: { label: "No completaste el proceso",                   tipo: "neutral"  },
};

const BADGE_CLASS = {
  success: styles.badgeSuccess,
  warning: styles.badgeWarning,
  danger:  styles.badgeDanger,
  neutral: styles.badgeNeutral,
};

function resolveEstado(solicitud) {
  // Estado gestión es el más definitivo (materializado por backoffice)
  if (solicitud.estadoGestion && ESTADO_BADGE[solicitud.estadoGestion]) {
    return ESTADO_BADGE[solicitud.estadoGestion];
  }
  // Onboarding rechazado
  if (solicitud.estadoOnboarding === "RECHAZADO") {
    return ESTADO_BADGE.RECHAZADO;
  }
  // Onboarding completo pero sin gestión → en análisis
  if (solicitud.estadoOnboarding === "ONBOARDING_COMPLETO") {
    return { label: "En análisis", tipo: "warning" };
  }
  // Por defecto: todavía en proceso
  return { label: "En proceso", tipo: "neutral" };
}

function formatCurrency(value) {
  if (value == null) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/* ── Componente tarjeta ────────────────────────────────────────────── */
function SolicitudCard({ solicitud }) {
  const estado = resolveEstado(solicitud);
  const { prestamo } = solicitud;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <span className={styles.cardRef}>Solicitud #{solicitud.id}</span>
          <br />
          <span className={`${styles.badge} ${BADGE_CLASS[estado.tipo]}`}>
            {estado.label}
          </span>
        </div>
        <span className={styles.cardDate}>{formatDate(solicitud.fechaSolicitud)}</span>
      </div>

      {prestamo && (
        <div className={styles.loanDetail}>
          <div className={styles.loanItem}>
            <span className={styles.loanLabel}>Monto</span>
            <span className={styles.loanValue}>{formatCurrency(prestamo.capitalSeleccionado)}</span>
          </div>
          <div className={styles.loanItem}>
            <span className={styles.loanLabel}>Cuota</span>
            <span className={styles.loanValue}>{formatCurrency(prestamo.cuota)}</span>
          </div>
          <div className={styles.loanItem}>
            <span className={styles.loanLabel}>Plazo</span>
            <span className={styles.loanValue}>
              {prestamo.plazoSeleccionado ? `${prestamo.plazoSeleccionado} meses` : "—"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Estado vacío ──────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon}>📋</span>
      <h2>Todavía no tenés solicitudes</h2>
      <p>
        Cuando completes el proceso de onboarding y simulación tu historial de
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

/* ── Pantalla principal ────────────────────────────────────────────── */
const MisSolicitudesScreen = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");

  useEffect(() => {
    authService
      .getSolicitudes()
      .then(({ solicitudes: data }) => setSolicitudes(data ?? []))
      .catch((err) => setError(err.message || "No pudimos cargar tus solicitudes."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Header />
      <main className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.heading}>
            <h1>Mis solicitudes</h1>
            <p>El historial de tus pedidos de préstamo en COFA.</p>
          </div>

          {loading && <p className={styles.loading}>Cargando tus solicitudes…</p>}

          {!loading && error && (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>⚠️</span>
              <h2>Algo salió mal</h2>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && solicitudes.length === 0 && <EmptyState />}

          {!loading && !error && solicitudes.length > 0 && (
            <div className={styles.list}>
              {solicitudes.map((s) => (
                <SolicitudCard key={s.id} solicitud={s} />
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
