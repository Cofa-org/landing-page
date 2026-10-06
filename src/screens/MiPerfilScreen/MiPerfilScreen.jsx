import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header, Footer } from "../../Components/index.js";
import { useAuth } from "../../context/index.js";
import authService from "../../services/authService.js";
import PerfilTabs from "./PerfilTabs.jsx";
import { resolveEstado } from "../MisSolicitudesScreen/resolveEstado.js";
import styles from "./MiPerfilScreen.module.css";

/* ── Helpers ──────────────────────────────────────────────────────── */
function formatDate(iso) {
  if (!iso) return "—";
  const raw = String(iso);
  const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(iso);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDni(dni) {
  if (!dni) return "—";
  const digits = String(dni).replace(/\D/g, "");
  if (!digits) return String(dni);
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

const TITLE_CASE_PRESERVE = new Set(["CP", "C.P.", "DNI", "CUIT", "CBU", "CABA"]);

function toTitleCase(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed
    .split(/(\s+)/)
    .map((token) => {
      if (/^\s+$/.test(token)) return token;
      const match = token.match(/^(.*?)([,.;:]*)$/);
      const core = match?.[1] ?? token;
      const punct = match?.[2] ?? "";
      if (!core) return token;
      if (TITLE_CASE_PRESERVE.has(core.toUpperCase())) return `${core.toUpperCase()}${punct}`;
      return `${core.charAt(0).toUpperCase()}${core.slice(1).toLowerCase()}${punct}`;
    })
    .join("");
}

function loanBadgeClass(estado) {
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

const PREVIEW_LIMIT = 2;
const BADGE_CLASS = {
  success: styles.badgeSuccess,
  warning: styles.badgeWarning,
  danger: styles.badgeDanger,
  neutral: styles.badgeNeutral,
};

/* ── Sección: Información de cuenta ──────────────────────────────── */
function InfoCuenta({ user }) {
  const nombre = toTitleCase(user?.nombreCompleto);
  const dni = user?.dni;
  const fechaNacimiento = user?.fechaNacimiento;
  const domicilio = toTitleCase(user?.domicilio);

  return (
    <div className={`${styles.card} ${styles.accountCard}`}>
      <div className={styles.cardHeader}><h2>Información de cuenta</h2></div>
      <div className={styles.cardBody}>
        {nombre ? (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Nombre completo</span>
            <span className={styles.infoValue}>{nombre}</span>
          </div>
        ) : null}
        {dni ? (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>DNI</span>
            <span className={styles.infoValue}>{formatDni(dni)}</span>
          </div>
        ) : null}
        {fechaNacimiento ? (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Fecha de nacimiento</span>
            <span className={styles.infoValue}>{formatDate(fechaNacimiento)}</span>
          </div>
        ) : null}
        {domicilio ? (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Domicilio</span>
            <span className={styles.infoValue}>{domicilio}</span>
          </div>
        ) : null}
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

function SolicitudPreview({ solicitud }) {
  const estado = resolveEstado(solicitud);
  return (
    <div className={styles.previewItem}>
      <span className={styles.previewRef}>Solicitud #{solicitud.id}</span>
      <span className={`${styles.infoLabel} ${styles.previewDateLabel}`}>
        Fecha de solicitud
      </span>
      <span className={`${styles.badge} ${BADGE_CLASS[estado.tipo]}`}>
        {estado.label}
      </span>
      <span className={styles.previewDate}>
        {formatDate(solicitud.fechaSolicitud)}
      </span>
    </div>
  );
}

/* ── Sección: Mis solicitudes (resumen) ───────────────────────────── */
function SolicitudesResumen() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService
      .getSolicitudes()
      .then(({ solicitudes: data }) => {
        const list = data ?? [];
        setSolicitudes(list);
        setCount(list.length);
      })
      .catch(() => setCount(null))
      .finally(() => setLoading(false));
  }, []);

  const preview = solicitudes.slice(0, PREVIEW_LIMIT);

  return (
    <div className={`${styles.card} ${styles.solicitudesCard}`}>
      <div className={styles.cardHeader}>
        <h2>
          <Link to="/mi-perfil/solicitudes" className={styles.cardTitleLink}>
            Mis solicitudes
          </Link>
        </h2>
      </div>
      <div className={styles.cardBody}>
        {loading && <span className={styles.solicitudesText}>Cargando…</span>}

        {!loading && count === null && (
          <span className={styles.solicitudesText}>
            No pudimos cargar tus solicitudes.
          </span>
        )}

        {!loading && count === 0 && (
          <div className={styles.solicitudesRow}>
            <span className={styles.solicitudesText}>
              Todavía no tenés solicitudes.
            </span>
            <Link to="/" className={styles.solicitudesLink}>
              Quiero mi préstamo →
            </Link>
          </div>
        )}

        {!loading && count > 0 && (
          <>
            <div className={styles.previewList}>
              {preview.map((s) => (
                <SolicitudPreview key={s.id} solicitud={s} />
              ))}
            </div>
            <div className={styles.solicitudesRow}>
              <span className={styles.solicitudesText}>
                {count > PREVIEW_LIMIT
                  ? `Mostrando ${preview.length} de ${count}.`
                  : `${count} solicitud${count !== 1 ? "es" : ""} registrada${count !== 1 ? "s" : ""}.`}
              </span>
              <Link to="/mi-perfil/solicitudes" className={styles.solicitudesLink}>
                Ver todas →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PrestamoPreview({ prestamo }) {
  const fechaAlta = formatDate(prestamo.fecha);
  return (
    <div className={styles.previewItem}>
      <span className={styles.previewRef}>
        Préstamo {prestamo.id != null ? `#${prestamo.id}` : ""}
      </span>
      <span className={`${styles.infoLabel} ${styles.previewDateLabel}`}>
        Fecha de alta
      </span>
      {prestamo.estado ? (
        <span className={`${styles.badge} ${loanBadgeClass(prestamo.estado)}`}>
          {prestamo.estado}
        </span>
      ) : (
        <span />
      )}
      <span className={styles.previewDate}>{fechaAlta || "—"}</span>
    </div>
  );
}

function PrestamosResumen() {
  const [prestamos, setPrestamos] = useState([]);
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService
      .getPrestamos()
      .then(({ prestamos: data }) => {
        const list = data ?? [];
        setPrestamos(list);
        setCount(list.length);
      })
      .catch(() => setCount(null))
      .finally(() => setLoading(false));
  }, []);

  const preview = prestamos.slice(0, PREVIEW_LIMIT);

  return (
    <div className={`${styles.card} ${styles.prestamosCard}`}>
      <div className={styles.cardHeader}>
        <h2>
          <Link to="/mi-perfil/prestamos" className={styles.cardTitleLink}>
            Mis préstamos
          </Link>
        </h2>
      </div>
      <div className={styles.cardBody}>
        {loading && <span className={styles.solicitudesText}>Cargando…</span>}

        {!loading && count === null && (
          <span className={styles.solicitudesText}>
            No pudimos cargar tus préstamos.
          </span>
        )}

        {!loading && count === 0 && (
          <div className={styles.solicitudesRow}>
            <span className={styles.solicitudesText}>
              No tenés préstamos en tu historial.
            </span>
            <Link to="/" className={styles.solicitudesLink}>
              Quiero mi préstamo →
            </Link>
          </div>
        )}

        {!loading && count > 0 && (
          <>
            <div className={styles.previewList}>
              {preview.map((p, index) => (
                <PrestamoPreview key={p.id ?? `prestamo-${index}`} prestamo={p} />
              ))}
            </div>
            <div className={styles.solicitudesRow}>
              <span className={styles.solicitudesText}>
                {count > PREVIEW_LIMIT
                  ? `Mostrando ${preview.length} de ${count}.`
                  : `${count} préstamo${count !== 1 ? "s" : ""} en tu historial.`}
              </span>
              <Link to="/mi-perfil/prestamos" className={styles.solicitudesLink}>
                Ver todos →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Pantalla principal ───────────────────────────────────────────── */
const MiPerfilScreen = () => {
  const { user } = useAuth();

  return (
    <>
      <Header />
      <main className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.heading}>
            <h1>Mi perfil</h1>
            <p>Tus datos, solicitudes y préstamos.</p>
            <PerfilTabs />
          </div>

          <InfoCuenta user={user} />
          <SolicitudesResumen />
          <PrestamosResumen />
        </div>
      </main>
      <Footer />
    </>
  );
};

export default MiPerfilScreen;
