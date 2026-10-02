import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchTestPersonas } from "../../../services/testPersonasService.js";

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

  const resetSession = useCallback(() => {
    // Clear leadToken cookie (same name + path as COOKIE_LEAD_TOKEN_CONFIG).
    document.cookie = "leadToken=; expires=Thu,01 Jan 1970 00:00:00 GMT; path=/";
    setSearchParams({});
    window.location.reload();
  }, [setSearchParams]);

  return { collapsed, setCollapsed, personas, activePersonaId, selectPersona, resetSession };
}