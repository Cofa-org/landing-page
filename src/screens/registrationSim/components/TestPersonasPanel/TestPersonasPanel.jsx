import { useTestPersonasPanel, PERSONAS_CON_AGREGAR_EMAIL } from "../../hooks/useTestPersonasPanel.js";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import { isTestPersonasVisible } from "../../../../config.js";
import styles from "./TestPersonasPanel.module.css";

const TestPersonasPanel = () => {
  if (!isTestPersonasVisible()) return null;

  const { collapsed, setCollapsed, personas, activePersonaId, selectPersona, resetSession, addEmail, emailStatusByPersona } = useTestPersonasPanel();

  return (
    <div className={styles.panel} data-testid="test-personas-panel">
      <div className={styles.header}>
        <span>🧪 Test Personas (dev)</span>
        <GenericButton variant="secondary" size="small" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? "Expandir" : "Ocultar"}
        </GenericButton>
      </div>
      {!collapsed && (
        <>
          <ul className={styles.list}>
            {personas.map((p) => (
              <li key={p.id} className={p.id === activePersonaId ? styles.active : ""}>
                <GenericButton variant="outline" onClick={() => selectPersona(p.id)}>
                  <strong>{p.label}</strong>
                  {p.descripcion && <small className={styles.desc}>{p.descripcion}</small>}
                  {p.tip && <small className={styles.tip}>💡 {p.tip}</small>}
                </GenericButton>
                {PERSONAS_CON_AGREGAR_EMAIL.has(p.id) && (
                  <GenericButton
                    variant="secondary"
                    size="small"
                    onClick={() => addEmail(p.id)}
                    loading={emailStatusByPersona[p.id] === "loading"}
                    disabled={emailStatusByPersona[p.id] === "added"}
                    aria-busy={emailStatusByPersona[p.id] === "loading"}
                    aria-label={emailStatusByPersona[p.id] === "loading" ? "Agregando email" : undefined}
                    data-testid="test-personas-add-email-button"
                  >
                    {emailStatusByPersona[p.id] === "added" ? "Email agregado" : "✉️ Agregar email"}
                  </GenericButton>
                )}
              </li>
            ))}
          </ul>
          <GenericButton variant="secondary" size="small" onClick={resetSession}>
            🔄 Reset session
          </GenericButton>
        </>
      )}
    </div>
  );
};

export default TestPersonasPanel;
