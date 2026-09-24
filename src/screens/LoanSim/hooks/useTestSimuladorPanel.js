import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isTestPersonasVisible } from "../../../config.js";
import {
  fetchTestPersonaById,
  fetchTestPersonas,
  resetTestPersonaSimulation,
} from "../../../services/testPersonasService.js";

/**
 * sessionStorage key donde el panel persiste la persona seleccionada.
 * El back la lee vía sessionStorage en `initVerification` (ver Task 0.9).
 */
export const SIMULADOR_TEST_PERSONA_STORAGE_KEY = "simuladorTestPersona";

/**
 * Hook del panel flotante de personas-test del simulador.
 *
 * Responsibilities:
 *  - Cargar la lista de personas-test filtradas por `useCases.includes("simulador")`.
 *  - Persistir la persona seleccionada en sessionStorage y navegar a `/loan-sim`.
 *  - Exponer un `resetSession` para limpiar el sessionStorage.
 *
 * Gating (cualquiera habilita el fetch):
 *  - `import.meta.env.DEV === true`
 *  - URL contiene `?testMode=1`
 *
 * En Vitest `import.meta.env.DEV` es siempre true (Vite lo inyecta como
 * literal en modo "test"), por lo que el branch "no dev → no fetch" NO es
 * unit-testeable desde acá — es garantía de build-time del plugin de Vite.
 *
 * @returns {{
 *   personas: Array<{id: string, label?: string, useCases?: string[]}>,
 *   loading: boolean,
 *   error: string | null,
 *   selectPersona: (personaId: string) => Promise<void>,
 *   resetSession: () => void,
 * }}
 */
export function useTestSimuladorPanel() {
  const navigate = useNavigate();
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Gate del panel centralizado en `isTestPersonasVisible` (config.js):
    // habilita el panel cuando Vite está en dev o la URL trae ?testMode=1.
    if (!isTestPersonasVisible()) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    fetchTestPersonas()
      .then((all) => {
        if (cancelled) return;
        const filtered = (all || []).filter((persona) =>
          (persona.useCases || []).includes("simulador"),
        );
        
        setPersonas(filtered);
        setLoading(false);
      })
      .catch((fetchError) => {
        if (cancelled) return;
        setError(fetchError.message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectPersona = useCallback(
    async (personaId) => {
      const persona = await fetchTestPersonaById(personaId);
      if (!persona) return;

      // Caso NORIEGA (cliente real): resetear simulación via API y navegar
      // al link real con full reload. NO usamos sessionStorage ni
      // `?tp=...` porque el flujo debe correr toda la lógica real del
      // simulador contra el lead existente, sin bypass.
      if (persona.simuladorConfig?.realClient) {
        // Defense-in-depth: el state-changing sink (POST + navegación
        // cross-origin al link real) solo corre en builds de dev. Si
        // el panel se renderizó por `?testMode=1` en un build de prod,
        // abortamos antes del POST para evitar resetear una simulación
        // real desde la UI. El backend también rechaza via
        // isTestPersonasEnabled() + NODE_ENV check, pero la defensa
        // en frontend debe ser conservadora también.
        if (!import.meta.env.VITE_DEV) {
          console.warn("REAL_CLIENT_RESET_BLOCKED_IN_PRODUCTION", { personaId });
          return;
        }
        try {
          await resetTestPersonaSimulation(personaId);
        } catch (resetErr) {
          console.warn("RESET_SIMULACION_FAILED:", resetErr);
          // Continuamos igual: el usuario puede reintentar manualmente
          // desde el panel, o seguir con la simulación existente.
        }
        sessionStorage.removeItem(SIMULADOR_TEST_PERSONA_STORAGE_KEY);
        const shortId = persona.simuladorConfig.shortId;
        if (!shortId) {
          console.warn("REAL_CLIENT_PERSONA_MISSING_SHORT_ID", { personaId });
          return;
        }
        // Full reload para que /simulador?id=... arranque el path real
        // de consumeLink desde cero (no useLoanSimulator hidratado).
        window.location.href = `/simulador?id=${encodeURIComponent(shortId)}`;
        return;
      }

      sessionStorage.setItem(
        SIMULADOR_TEST_PERSONA_STORAGE_KEY,
        JSON.stringify(persona),
      );
      // Pass personaId via URL so the simulator hook can read it from
      // searchParams (reliably re-runs the init effect). The sessionStorage
      // payload above is kept as a fallback for `useLoanSimulator` when the
      // persona is already hydrated (e.g. on subsequent clicks without a
      // full reload).
      navigate(`/simulador?tp=${encodeURIComponent(personaId)}`);
    },
    [navigate],
  );

  const resetSession = useCallback(() => {
    sessionStorage.removeItem(SIMULADOR_TEST_PERSONA_STORAGE_KEY);
  }, []);

  return { personas, loading, error, selectPersona, resetSession };
}