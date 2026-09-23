import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchTestPersonaById } from "../../../services/testPersonasService.js";

// Strip "+549" (or "+54" + carrier) prefix to get the local 10-digit format
// that the registration form expects.
function toLocalCelular(international) {
  if (!international) return "";
  // Remove all non-digits, then drop the country code "54" and any leading "9"
  const digits = String(international).replace(/\D/g, "");
  if (digits.startsWith("549") && digits.length === 13) {
    return digits.slice(3); // drop "549"
  }
  if (digits.startsWith("54") && digits.length === 12) {
    return digits.slice(2); // drop "54"
  }
  return digits;
}

export function useTestPersonaPrefill(setFormData) {
  const [searchParams] = useSearchParams();
  const personaId = searchParams.get("testPersona");

  useEffect(() => {
    if (!personaId) return;
    let cancelled = false;
    (async () => {
      const persona = await fetchTestPersonaById(personaId);
      if (cancelled || !persona) return;
      setFormData({
        dni: persona.dni,
        fechaNacimiento: persona.fechaNacimiento,
        celular: toLocalCelular(persona.telefonos[0]),
        email: persona.email,
        // Backend expects canonical key, not display value
        situacionLaboral: "RELACION_DEPENDENCIA",
        // Auto-check required checkboxes (form requires both to enable submit)
        term_y_cond: true,
        prevencion_fraudes: true,
      });
    })();
    return () => { cancelled = true; };
  }, [personaId, setFormData]);
}