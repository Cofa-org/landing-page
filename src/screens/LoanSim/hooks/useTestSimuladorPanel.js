import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DEV, isTestPersonasVisible } from "../../../config.js";
import {
  fetchTestPersonaById,
  fetchTestPersonas,
  resetTestPersonaSimulation,
  aprobarCbuTestPersona,
} from "../../../services/testPersonasService.js";

/**
 * sessionStorage key donde el panel persiste la persona seleccionada.
 * El back la lee vía sessionStorage en `initVerification` (ver Task 0.9).
 */
export const SIMULADOR_TEST_PERSONA_STORAGE_KEY = "simuladorTestPersona";

/**
 * Set de personas del catálogo que admiten el botón "✅ Validar CBU" del
 * panel del simulador (Plan 2026-10-21).
 *
 * Es el caso de QA del gate de validación manual de CBU: la persona llega a
 * la pantalla de espera (`PENDING_CBU_VALIDATION`) y este botón dispara el
 * approve (el mismo compare-and-set que aplica el backoffice). Con el
 * approve hecho, el "Verificar estado" de la pantalla lleva al front al
 * paso `CBU_VALIDATION` con la rama "ya validado".
 *
 * Single source of truth — el componente `TestSimuladorPanel` lo importa
 * para decidir qué botón renderizar (mismo patrón que
 * `PERSONAS_CON_AGREGAR_EMAIL` del panel de registro).
 */
export const PERSONAS_CON_APROBAR_CBU = new Set(["SIM_CBU_PENDING"]);

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
 *   aprobarCbu: (personaId: string) => Promise<void>,
 *   approvingCbu: string | null,
 *   cbuAprobadoPara: string | null,
 * }}
 */
export function useTestSimuladorPanel() {
  const navigate = useNavigate();
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Estado del approve del CBU (caso de QA del gate de validación manual).
  const [approvingCbu, setApprovingCbu] = useState(null);
  const [cbuAprobadoPara, setCbuAprobadoPara] = useState(null);

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
        if (!DEV) {
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

      // Plan 2026-10-21 (caso de QA del gate de CBU): el escenario arranca
      // limpio en cada selección — se resetea la simulación (estado,
      // marcadores de aprobación y cuenta nueva) para que el operador
      // pueda repetir el ciclo tantas veces como necesite.
      // Mismo patrón que las personas `realClient` (que también resetean
      // su simulación antes de navegar).
      if (persona.simuladorConfig?.pendingCbuValidation) {
        // El caso de CBU sólo puede tocar la fila sintética de
        // `SIM_CBU_PENDING` (el `scoringId` sale siempre del catálogo), así
        // que el modo explícito `?testMode=1` —que existe para operar el
        // panel en un build de staging, donde `VITE_DEV` no está seteado—
        // también puede correr estos POST. La rama de NORIEGA, que sí
        // resetea datos de un cliente real, mantiene su guard estricto.
        // El backend igual rechaza via isTestPersonasEnabled() + NODE_ENV.
        if (!DEV && !isTestPersonasVisible()) {
          console.warn("CBU_RESET_BLOCKED_IN_PRODUCTION", { personaId });
          return;
        }
        try {
          await resetTestPersonaSimulation(personaId);
        } catch (resetErr) {
          console.warn("RESET_ESCENARIO_CBU_FAILED:", resetErr);
          // Se avisa al operador y NO se navega: si el reset falló, el
          // escenario puede no quedar armado y el simulador arrancaría en
          // el step normal — el QA creía que está en el caso y
          // quedaría en una pantalla que no es la que espera.
          window.alert(
            `No se pudo resetear el escenario de CBU: ${resetErr.message}`,
          );
          return;
        }
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
      //
      // Plan 2026-10-21: el caso de CBU manual necesita un full reload —
      // `navigate()` a la misma URL no re-dispara el init del simulador
      // (el effect de `useLoanSimulator` no corre otra vez) y el re-arm
      // del escenario no se aplicaría.
      if (persona.simuladorConfig?.pendingCbuValidation) {
        // El reload reemplaza la URL completa: sin preservar el `testMode=1`
        // el panel se cerraría (su gate es `DEV || ?testMode=1`) y el botón
        // "Validar CBU" desaparecería justo después de arrancar el caso.
        const keepTestMode =
          new URLSearchParams(window.location.search).get("testMode") === "1"
            ? "&testMode=1"
            : "";
        window.location.href = `/simulador?tp=${encodeURIComponent(personaId)}${keepTestMode}`;
        return;
      }

      navigate(`/simulador?tp=${encodeURIComponent(personaId)}`);
    },
    [navigate],
  );

  /**
   * Aprueba (como asesor) el CBU/CVU de la simulación estacionada en
   * PENDING_CBU_VALIDATION de una persona del catálogo.
   *
   * Deja `cbuAprobadoPara` seteado para que el botón del panel muestre el
   * estado "✅ CBU validado" y el operador sepa que puede seguir con
   * "Verificar estado".
   */
  const aprobarCbu = useCallback(async (personaId) => {
    // El caso de CBU sólo puede tocar la fila sintética de
    // `SIM_CBU_PENDING` (el `scoringId` sale siempre del catálogo), así que
    // el modo explícito `?testMode=1` —que existe para operar el panel en
    // un build de staging, donde `VITE_DEV` no está seteado— también puede
    // correr este POST. La rama de NORIEGA, que sí toca datos de un cliente
    // real, mantiene su guard estricto. El corte va ANTES de tocar el
    // estado local para no marcar la persona como validada si el request ni
    // se hizo.
    if (!DEV && !isTestPersonasVisible()) {
      console.warn("CBU_APPROVE_BLOCKED_IN_PRODUCTION", { personaId });
      return;
    }
    setApprovingCbu(personaId);
    try {
      // OJO con el contrato: el endpoint responde HTTP 200 en los DOS casos
      // (aprobo o no habia nada pendiente). `aprobarCbuTestPersona` devuelve
      // el body parseado, asi que el "no habia nada pendiente" **no** llega
      // como excepcion: hay que mirar el `success` del body y mostrar su
      // `message`. El `catch` es para el caso en que el request falla de
      // verdad (red, 404/403 del back).
      const result = await aprobarCbuTestPersona(personaId);
      // `!result?.success` (y no `result?.success === false`) para no dar por
      // aprobado un body inesperado (p.ej. sin `success`): el approve sólo
      // se marca si el back confirmó explícitamente.
      if (!result?.success) {
        window.alert(result?.message || "No se pudo validar el CBU.");
        return;
      }
      setCbuAprobadoPara(personaId);
    } catch (err) {
      window.alert(`No se pudo validar el CBU: ${err.message}`);
    } finally {
      setApprovingCbu(null);
    }
  }, []);

  const resetSession = useCallback(() => {
    sessionStorage.removeItem(SIMULADOR_TEST_PERSONA_STORAGE_KEY);
    navigate("/simulador");
  }, []);

  return {
    personas,
    loading,
    error,
    selectPersona,
    resetSession,
    aprobarCbu,
    approvingCbu,
    cbuAprobadoPara,
  };
}