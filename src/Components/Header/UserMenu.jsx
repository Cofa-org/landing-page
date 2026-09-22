import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiLogOut, FiFileText } from "react-icons/fi";
import { useAuth } from "../../context/index.js";
import styles from "./UserMenu.module.css";

/**
 * Avatar del usuario autenticado en el header.
 * Muestra un ícono circular; al hacer click abre un dropdown con el
 * email y la opción de cerrar sesión.
 */
const UserMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/");
  };

  const email = user?.email ?? "";
  if (!email) return null;

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        className="header-avatar-btn"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Menú de cuenta"
        title={email}
      >
        <FiUser size={18} />
      </button>

      {open && (
        <div className={styles.dropdown} role="menu">
          {/* Email informativo (no clickeable) */}
          <div className={styles.dropdownEmail} title={email}>
            {email}
          </div>
          <div className={styles.divider} />
          <Link
            to="/mis-solicitudes"
            className={styles.dropdownItem}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <FiFileText size={14} />
            Mis solicitudes
          </Link>
          <div className={styles.divider} />
          <button
            className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
            onClick={handleLogout}
            role="menuitem"
          >
            <FiLogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
