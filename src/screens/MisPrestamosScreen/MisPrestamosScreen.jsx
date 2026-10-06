import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header, Footer } from "../../Components/index.js";
import authService from "../../services/authService.js";
import PerfilTabs from "../MiPerfilScreen/PerfilTabs.jsx";
import styles from "./MisPrestamosScreen.module.css";

function formatDate(value) {
  if (!value) return null;
  const raw = String(value);
  const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("es-AR", {
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

function badgeClass(estado) {
  const key = String(estado || "").toUpperCase();
  if (key === "VIGENTE") return styles.badgeSuccess;
  if (key === "CANCELADO" || key === "FINALIZADO" || key === "LIQUIDADO") {
    return styles.badgeNeutral;
  }
  if (key.includes("MORA") || key.includes("JUDICIAL") || key === "ANULADO") {
    return styles.badgeDanger;
  }
  return styles.badgeWarning;
}

function plazoLabel(prestamo) {
  if (prestamo.plazo == null) return null;
  return `${prestamo.plazo} ${prestamo.plazo === 1 ? "cuota" : "cuotas"}`;
}

function PrestamoCard({ prestamo }) {
  const fecha = formatDate(prestamo.fecha);
  const proximoVto = formatDate(prestamo.proximoVto);
  const plazo = plazoLabel(prestamo);
  const hasDetail =
    prestamo.capital != null ||
    prestamo.cuota != null ||
    plazo ||
    proximoVto;

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <span className={styles.cardRef}>
            Préstamo {prestamo.id != null ? `#${prestamo.id}` : ""}
            {prestamo.linea ? ` · ${prestamo.linea}` : ""}
          </span>
          {prestamo.estado && (
            <span className={`${styles.badge} ${badgeClass(prestamo.estado)}`}>
              {prestamo.estado}
            </span>
          )}
        </div>
        {fecha && <span className={styles.cardDate}>{fecha}</span>}
      </div>

      {hasDetail && (
        <div className={styles.loanDetail}>
          {prestamo.capital != null && (
            <div className={styles.loanItem}>
              <span className={styles.loanLabel}>Monto</span>
              <span className={styles.loanValue}>
                {formatCurrency(prestamo.capital)}
              </span>
            </div>
          )}
          {prestamo.cuota != null && (
            <div className={styles.loanItem}>
              <span className={styles.loanLabel}>Valor cuota</span>
              <span className={styles.loanValue}>
                {formatCurrency(prestamo.cuota)}
              </span>
            </div>
          )}
          {plazo && (
            <div className={styles.loanItem}>
              <span className={styles.loanLabel}>Plazo</span>
              <span className={styles.loanValue}>{plazo}</span>
            </div>
          )}
          {proximoVto && (
            <div className={styles.loanItem}>
              <span className={styles.loanLabel}>Próximo vencimiento</span>
              <span className={styles.loanValue}>{proximoVto}</span>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function EmptyState() {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon} aria-hidden="true">
        🏦
      </span>
      <h2>No tenés préstamos en tu historial</h2>
      <p>
        Todavía no registramos préstamos a tu nombre. Cuando seas cliente de
        COFA, acá vas a ver los vigentes, finalizados y cancelados.
      </p>
      <div className={styles.emptyAction}>
        <Link to="/" className="primary-btn">
          Quiero mi préstamo
        </Link>
      </div>
    </div>
  );
}

const MisPrestamosScreen = () => {
  const [prestamos, setPrestamos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    authService
      .getPrestamos()
      .then(({ prestamos: data }) => setPrestamos(data ?? []))
      .catch((err) =>
        setError(err.message || "No pudimos cargar tus préstamos."),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Header />
      <main className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.heading}>
            <h1>Mis préstamos</h1>
            <p>El historial de tus préstamos en COFA.</p>
            <PerfilTabs />
          </div>

          {loading && (
            <p className={styles.loading}>Cargando tus préstamos…</p>
          )}

          {!loading && error && (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>⚠️</span>
              <h2>Algo salió mal</h2>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && prestamos.length === 0 && <EmptyState />}

          {!loading && !error && prestamos.length > 0 && (
            <div className={styles.list}>
              {prestamos.map((p, index) => (
                <PrestamoCard
                  key={p.id ?? `prestamo-${index}`}
                  prestamo={p}
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

export default MisPrestamosScreen;
