import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchTestPersonas, resetPersonaEmail } from "../../../services/testPersonasService.js";

/**
 * Set de personas del catálogo que admiten el flujo "agregar email"
 * desde el panel de test (botón "✉️ Agregar email"). El back muta
 * `personas[i].email` in-memory; el operador recarga y la restore path
 * del flujo de registro lee la nueva `persona.email` para transicionar
 * fuera de `EmailPendingAdvisorStep`.
 *
 * Single source of truth — el componente `TestPersonasPanel` lo importa
 * para decidir qué botón renderizar, y el `resetSession` de este hook
 * lo itera para limpiar el email de vuelta al estado inicial.
 *
 * (Plan 2026-10-17, advisor gate.)
 */
export const PERSONAS_CON_AGREGAR_EMAIL = new Set(["CARLOS_NO_EMAIL"]);

export function useTestPersonasPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);
  const [personas, setPersonas] = useState([]);
  const activePersonaId = searchParams.get("testPersona");

  useEffect(() => {
    let cancelled = false;
    fetchTestPersonas()
      .then((all) => {
        if (cancelled) return;
        // Filter por useCases: el panel del registro solo muestra personas
        // marcadas con `useCases.includes("registro")`. Sin este filter
        // aparecen personas del simulador (ej. SIM_NORIEGA_REAL) que
        // rompen el flow del registro — su `selectPersona` solo setea
        // searchParams, no llama al reset ni navega al link real.
        const filtered = (all || []).filter((persona) =>
          (persona.useCases || []).includes("registro"),
        );
        setPersonas(filtered);
      })
      .catch(() => { if (!cancelled) setPersonas([]); });
    return () => { cancelled = true; };
  }, []);

  const selectPersona = useCallback((personaId) => {
    setSearchParams(
      (prev) => {
        prev.set("testPersona", personaId);
        return prev;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const resetSession = useCallback(async () => {
    // Invariante: "al empezar el caso el email siempre debe estar vacío".
    // Llamamos resetPersonaEmail para cada persona en PERSONAS_CON_AGREGAR_EMAIL
    // antes de recargar — así el operador puede volver a CARLOS_NO_EMAIL y
    // re-ejecutar el flow desde EmailPendingAdvisorStep con el catálogo
    // en estado inicial.
    await Promise.all(
      Array.from(PERSONAS_CON_AGREGAR_EMAIL).map((id) => resetPersonaEmail(id)),
    );
    // Clear leadToken cookie (same name + path as COOKIE_LEAD_TOKEN_CONFIG).
    document.cookie = "leadToken=; expires=Thu,01 Jan 1970 00:00:00 GMT; path=/";
    setSearchParams({});
    window.location.reload();
  }, [setSearchParams]);

  return { collapsed, setCollapsed, personas, activePersonaId, selectPersona, resetSession };
}
