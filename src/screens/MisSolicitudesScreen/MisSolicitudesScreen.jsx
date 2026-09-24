import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header, Footer } from "../../Components/index.js";
import authService from "../../services/authService.js";
import styles from "./MisSolicitudesScreen.module.css";

/* ── Helpers de fecha ────────────────────────────────────────────── */
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function addDays(iso, days) {
  if (!iso) return null;
  return new Date(new Date(iso).getTime() + days * 24 * 60 * 60 * 1000);
}

function formatCurrency(value) {
  if (value == null) return null;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

/* ── Resolución de estado (6 estados con prioridad) ─────────────── */
/**
 * Devuelve { label, tipo, descripcion, accion, retryDate }
 *  tipo: 'success' | 'warning' | 'danger' | 'neutral'
 *  accion: 'webchat' | null
 *  retryDate: Date | null  (solo para NO_APROBADA)
 *
 * Nota sobre estado_gestion:
 *  El backoffice deriva este campo con una lógica COALESCE (scoring + onboarding).
 *  Nosotros leemos el valor crudo de la DB, por eso normalizamos a uppercase y
 *  tratamos como equivalentes el rechazo por gestión y por onboarding.
 */
function resolveEstado(solicitud) {
  const {
    estadoOnboarding,
    estadoOnboardingFecha,
    estadoGestion,
    fechaEstadoGestion,
    prestamo,
  } = solicitud;

  // Normalizamos para evitar problemas de case (ediciones manuales en Supabase, etc.)
  const gestion = estadoGestion?.toUpperCase() ?? null;
  const onboarding = estadoOnboarding?.toUpperCase() ?? null;

  // 1. Préstamo procesado en sistema externo → solicitud finalizada
  if (prestamo?.idPrestamoDB) {
    return {
      label: "Solicitud finalizada",
      tipo: "success",
      descripcion: "Tu préstamo fue procesado exitosamente.",
      accion: null,
      retryDate: null,
    };
  }

  // 2. Aprobada por gestión
  if (gestion === "ACEPTADO") {
    return {
      label: "Aprobada",
      tipo: "success",
      descripcion:
        "Tu solicitud fue aprobada. Estamos gestionando tu préstamo.",
      accion: null,
      retryDate: null,
    };
  }

  // 3. No aprobada — rechazada explícitamente por gestión
  if (gestion === "RECHAZADO") {
    const fechaRechazo = fechaEstadoGestion ?? estadoOnboardingFecha ?? null;
    return {
      label: "No aprobada",
      tipo: "danger",
      descripcion: null,
      accion: null,
      retryDate: fechaRechazo ? addDays(fechaRechazo, 45) : null,
    };
  }

  // 4. No aprobada — rechazada en el flujo de onboarding
  if (onboarding === "RECHAZADO") {
    const fechaRechazo = estadoOnboardingFecha ?? fechaEstadoGestion ?? null;
    return {
      label: "No aprobada",
      tipo: "danger",
      descripcion: null,
      accion: null,
      retryDate: fechaRechazo ? addDays(fechaRechazo, 45) : null,
    };
  }

  // 5. En análisis (onboarding completo, esperando resolución de gestión)
  if (gestion === "ANALIZAR" || onboarding === "ONBOARDING_COMPLETO") {
    return {
      label: "En análisis",
      tipo: "warning",
      descripcion: "Estamos revisando tu solicitud.",
      accion: null,
      retryDate: null,
    };
  }

  // 6. Solicitud incompleta (LEAD_CREADO, DNI_SUBIDO, RECIBO_SUBIDO, CELULAR_VALIDADO, ABANDONADO, etc.)
  return {
    label: "Solicitud incompleta",
    tipo: "neutral",
    descripcion: "Para retomar tu solicitud, comunicate con un asesor.",
    accion: null,
    retryDate: null,
  };
}

const BADGE_CLASS = {
  success: styles.badgeSuccess,
  warning: styles.badgeWarning,
  danger: styles.badgeDanger,
  neutral: styles.badgeNeutral,
};

/* ── Tarjeta de solicitud ────────────────────────────────────────── */
function SolicitudCard({ solicitud }) {
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
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    authService
      .getSolicitudes()
      .then(({ solicitudes: data }) => setSolicitudes(data ?? []))
      .catch((err) =>
        setError(err.message || "No pudimos cargar tus solicitudes."),
      )
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
