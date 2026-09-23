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
      .then((p) => { if (!cancelled) setPersonas(p); })
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