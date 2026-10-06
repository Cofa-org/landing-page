import { NavLink } from "react-router-dom";
import styles from "./PerfilTabs.module.css";

const TABS = [
  { to: "/mi-perfil", label: "Mi perfil", shortLabel: "Perfil", end: true },
  { to: "/mi-perfil/solicitudes", label: "Mis solicitudes", shortLabel: "Solicitudes" },
  { to: "/mi-perfil/prestamos", label: "Mis préstamos", shortLabel: "Préstamos" },
  { to: "/mi-perfil/configuracion", label: "Configuración", shortLabel: "Ajustes" },
];

const PerfilTabs = () => (
  <nav className={styles.tabs} aria-label="Secciones de tu cuenta">
    {TABS.map((tab) => (
      <NavLink
        key={tab.to}
        to={tab.to}
        end={tab.end}
        aria-label={tab.label}
        className={({ isActive }) =>
          `${styles.tab} ${isActive ? styles.tabActive : ""}`
        }
      >
        <span className={styles.labelFull}>{tab.label}</span>
        <span className={styles.labelShort}>{tab.shortLabel}</span>
      </NavLink>
    ))}
  </nav>
);

export default PerfilTabs;
