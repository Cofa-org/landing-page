import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchTestPersonaById,
  fetchTestPersonas,
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
    // Single source of truth del gate: true sólo en dev o con ?testMode=1.
    // Devuelve `true` cuando cualquiera de las dos está activa.
    const searchParams = new URLSearchParams(window.location.search);
       
    const isTestMode =
      import.meta.env.DEV || searchParams.get("testMode") === "1";

    if (!isTestMode) {
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