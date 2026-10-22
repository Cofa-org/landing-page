import { memo } from "react";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import { isTestPersonasVisible } from "../../../../config.js";
import { PERSONAS_CON_APROBAR_CBU } from "../../hooks/useTestSimuladorPanel.js";
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
 *
 * Plan 2026-10-21: para las personas de `PERSONAS_CON_APROBAR_CBU` el panel
 * además renderiza el botón "Validar CBU" (approve del CBU/CVU de la
 * simulación estacionada en PENDING_CBU_VALIDATION). El estado del approve
 * (`approvingCbu` / `cbuAprobadoPara`) y el POST viven en el hook; acá sólo
 * se renderizan y se reenvía el id de la persona.
 */
const TestSimuladorPanel = ({
  personas = [],
  onSelectPersona,
  onReset,
  onAprobarCbu,
  loading = false,
  approvingCbu = null,
  cbuAprobadoPara = null,
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
          <div key={persona.id} className={styles.personaItem}>
            <GenericButton
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
            {/* Plan 2026-10-21 (caso de QA del gate de validación manual de
                CBU): el botón aprueba el CBU/CVU de la simulación
                estacionada. Con el approve hecho, "Verificar estado" lleva
                al front al paso CBU_VALIDATION con la rama "ya validado".
                Vive FUERA del botón de persona: dos <button> anidados son
                HTML inválido. */}
            {PERSONAS_CON_APROBAR_CBU.has(persona.id) && (
              <GenericButton
                type='button'
                variant='secondary'
                onClick={() => onAprobarCbu?.(persona.id)}
                loading={approvingCbu === persona.id}
                disabled={cbuAprobadoPara === persona.id}
                // Con `loading` el GenericButton reemplaza los children por
                // un spinner `aria-hidden` → sin `aria-label` el botón
                // perdería su nombre accesible.
                // El label acompaña al texto visible: con el CBU ya validado
                // el botón MUESTRA "CBU validado" — si anunciara "Validar
                // CBU" el lector de pantalla describiría como accionable un
                // botón ya aplicado (WCAG 2.5.3 "Label in Name").
                aria-label={
                  cbuAprobadoPara === persona.id ? 'CBU validado' : 'Validar CBU'
                }
                aria-busy={approvingCbu === persona.id || undefined}
                className={styles.approveCbuButton}
                data-testid='test-simulador-panel-aprobar-cbu'
              >
                {cbuAprobadoPara === persona.id ? '✅ CBU validado' : '✅ Validar CBU'}
              </GenericButton>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(TestSimuladorPanel);
