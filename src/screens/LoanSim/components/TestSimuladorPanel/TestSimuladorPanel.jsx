import { memo } from "react";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import { isTestPersonasVisible } from "../../../../config.js";
import styles from "./TestSimuladorPanel.module.css";

/**
 * Dev-only panel mounted over /loan-sim to let QA pick a "test persona"
 * (SIM_HAPPY / SIM_DEVICE_REJECTED / SIM_SKIP_MOBBEX / SIM_OTP_EXPIRED).
 *
 * Rendering gate lives in src/config.js → `isTestPersonasVisible()`:
 * habilita la UI cuando Vite está en dev O la URL trae `?testMode=1`.
 *
 * Pure presentational: all data + navigation lives in the parent hook
 * (useTestSimuladorPanel, created in Task 0.6.1). This component only
 * renders buttons and forwards persona ids through onSelectPersona.
 */
const TestSimuladorPanel = ({
  personas = [],
  onSelectPersona,
  onReset,
  loading = false,
}) => {
  if (!isTestPersonasVisible()) return null;
  if (loading) return null;
  if (!personas || personas.length === 0) return null;

  return (
    <div
      className={styles.panel}
      data-testid="test-simulador-panel"
      role='region'
      aria-label='Test personas (simulador)'
    >
      <div className={styles.header}>
        <span className={styles.title}>
          <span className={styles.titleIcon} aria-hidden='true'>🧪</span>
          Test Personas (Simulador)
        </span>
        {onReset && (
          <GenericButton
            type='button'
            variant='secondary'
            onClick={onReset}
            className={styles.resetButton}
          >
            Reset
          </GenericButton>
        )}
      </div>
      <span className={styles.subtitle}>
        Elegí una persona para saltar el flujo de links externos.
      </span>
      <div className={styles.list}>
        {personas.map((persona) => (
          <GenericButton
            key={persona.id}
            type='button'
            variant='outline'
            onClick={() => onSelectPersona(persona.id)}
            className={styles.personaButton}
          >
            <span className={styles.personaLabel}>{persona.label}</span>
            {persona.descripcion && (
              <span className={styles.personaDesc}>{persona.descripcion}</span>
            )}
            {persona.tip && (
              <span className={styles.personaTip}>💡 {persona.tip}</span>
            )}
          </GenericButton>
        ))}
      </div>
    </div>
  );
};

export default memo(TestSimuladorPanel);
