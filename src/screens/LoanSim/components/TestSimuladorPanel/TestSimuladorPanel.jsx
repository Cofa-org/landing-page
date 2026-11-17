import { memo, useState } from "react";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import { isTestPersonasVisible } from "../../../../config.js";
import { PERSONAS_CON_APROBAR_CBU } from "../../hooks/useTestSimuladorPanel.js";
import { SISTEMA_AMORTIZACION } from '../../../../constants/sistema-amortizacion.constants.js';
import { esSistemaAmortizacionValido } from '../../../../lib/sistema-amortizacion.js';
import styles from "./TestSimuladorPanel.module.css";

const nombreSistema = sistema => sistema === SISTEMA_AMORTIZACION.FRANCES ? 'Francés' : 'Directo';

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
  startingPersona = null,
  error = null,
  sistemaActual = null,
  consultandoSistema = false,
}) => {
  const [sistemasSeleccionados, setSistemasSeleccionados] = useState({});
  const sistemaConfirmado = esSistemaAmortizacionValido(sistemaActual) ? sistemaActual : null;
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
            disabled={Boolean(startingPersona)}
            className={styles.resetButton}
          >
            Reset
          </GenericButton>
        )}
      </div>
      <span className={styles.subtitle}>
        Elegí una persona para saltar el flujo de links externos.
      </span>
      <p className={styles.currentSystem} role="status">
        {consultandoSistema ? 'Consultando sistema…' : sistemaConfirmado
          ? `Sistema actual: ${nombreSistema(sistemaConfirmado)}` : 'Sin simulación activa'}
      </p>
      {error && <p className={styles.errorMessage} role="alert">{error}</p>}
      <div className={styles.list}>
        {personas.map((persona) => {
          const sistemas = Array.isArray(persona.sistemasAmortizacion)
            ? persona.sistemasAmortizacion.filter(esSistemaAmortizacionValido) : [];
          const sistemaElegido = consultandoSistema ? '' : sistemasSeleccionados[persona.id] ||
            (sistemas.includes(sistemaConfirmado) ? sistemaConfirmado : sistemas[0]);
          const accionPrueba = consultandoSistema ? 'Consultando sistema…' : `Iniciar prueba en ${nombreSistema(sistemaElegido)}`;
          return (
          <div key={persona.id} className={styles.personaItem}>
            {sistemas.length > 0 && <>
              <label className={styles.systemLabel} htmlFor={`sistema-${persona.id}`}>Sistema para {persona.label}</label>
              <select id={`sistema-${persona.id}`} className={styles.systemSelect}
                value={sistemaElegido} disabled={Boolean(startingPersona) || consultandoSistema}
                onChange={event => setSistemasSeleccionados(current => ({ ...current, [persona.id]: event.target.value }))}>
                {consultandoSistema && <option value="">Consultando sistema…</option>}
                {sistemas.map(sistema => <option key={sistema} value={sistema}>
                  {nombreSistema(sistema)}
                </option>)}
              </select>
            </>}
            <GenericButton
              type='button'
              variant='outline'
              onClick={() => sistemas.length ? onSelectPersona(persona.id, sistemaElegido) : onSelectPersona(persona.id)}
              disabled={Boolean(startingPersona) || (sistemas.length > 0 && consultandoSistema)}
              loading={startingPersona === persona.id}
              aria-label={sistemas.length ? `${persona.label} — ${accionPrueba}` : undefined}
              aria-busy={startingPersona === persona.id || undefined}
              className={styles.personaButton}
            >
              <span className={styles.personaLabel}>{persona.label}</span>
              {persona.descripcion && (
                <span className={styles.personaDesc}>{persona.descripcion}</span>
              )}
              {persona.tip && (
                <span className={styles.personaTip}>💡 {persona.tip}</span>
              )}
              {sistemas.length > 0 && <span>{accionPrueba}</span>}
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
                disabled={cbuAprobadoPara === persona.id || Boolean(startingPersona)}
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
        ); })}
      </div>
    </div>
  );
};

export default memo(TestSimuladorPanel);
