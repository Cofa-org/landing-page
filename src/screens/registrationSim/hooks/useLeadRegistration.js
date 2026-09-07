import { useState, useCallback, useEffect } from "react";
import LeadRegistrationService from "../../../services/leadRegistrationService";
import { ERROR_CAUSE, ERROR_MESSAGE } from "../../../constants/error";
import { setCookie } from "../../../lib/utils";
import { COOKIE_LEAD_TOKEN_CONFIG, SITUACION_LABORAL_OPTIONS } from "../../../constants/LOAN_SIM.js";

const DNI_REGEX = /^\d{7,8}$/;
const CELULAR_REGEX = /^\d{10}$/;

// Detecta prefijos argentinos que el lead tipea por error y que el backoffice
// concatena mal, rompiendo el envío de SMS a LabsMobile.
//   549...  -> usuario tipeó "+549" (país + 9 mobile), debería ser sólo 10 dígitos locales
//   54...   -> usuario tipeó "+54" sin el 9 obligatorio de mobile
//   15...   -> prefijo legacy "15" sin código de área
//   011...  -> interurbano legacy Buenos Aires
//   0X...   -> cualquier interurbano nacional (0230, 0348, 02920, etc.)
const detectCelularPrefijoInvalido = (digits) => {
  if (/^549/.test(digits)) {
    return "Incluiste 549 (código de país). Ingresá sólo los 10 dígitos locales, sin el +549 (ej: 1145678901).";
  }
  if (/^54/.test(digits)) {
    return "Incluiste 54 sin el 9. Ingresá sólo los 10 dígitos locales (ej: 1145678901).";
  }
  if (/^15/.test(digits)) {
    return "Incluiste 15 (formato viejo). Ingresá los 10 dígitos con código de área (ej: 1145678901).";
  }
  if (/^011/.test(digits)) {
    return "Incluiste 011 (formato viejo). Ingresá los 10 dígitos con código de área, sin el 011 (ej: 1145678901).";
  }
  if (/^0\d/.test(digits)) {
    return "Incluiste un 0 interurbano. Ingresá sólo los 10 dígitos sin el 0 (ej: 1145678901).";
  }
  return null;
};

// Age validation moved to backend (pre-scoring gate in `crearLead`, 2026-09-02).
// Regla asimétrica: < 18 siempre rechaza; > 60 rechaza solo si NO es cliente COFA.
// El back persiste el rechazo con motivo_rechazo=EDAD_INVALIDA para visibilidad en backoffice.

export const SECURITY_SLIDES = [
  {
    title: "Detección de Fraude Inteligente",
    description:
      "Analizamos patrones en tiempo real utilizando inteligencia artificial para evitar transacciones no autorizadas.",
    image: "/img/security-fraud-detection.webp",
  },
  {
    title: "Protección Financiera Activa",
    description:
      "Tu dinero y tus datos están respaldados por protocolos internacionales de seguridad financiera.",
    image: "/img/security-financial-protection.webp",
  },
  {
    title: "Encriptación de Nivel Bancario",
    description:
      "Ciframos cada dato enviado con estándares AES-256 de nivel bancario para garantizar la total privacidad de tu información.",
    image: "/img/security-bank-encryption.webp",
  },
  {
    title: "Verificación de Identidad Digital",
    description:
      "Validamos tu identidad de forma segura para garantizar un proceso transparente y prevenir la suplantación.",
    image: "/img/security-identity-verification.webp",
  },
  {
    title: "Tranquilidad y Confianza Cofa",
    description:
      "Cofa es una plataforma transparente, segura y comprometida con el desarrollo de tu salud financiera.",
    image: "/img/security-cofa-trust.webp",
  },
];

export const useLeadRegistration = (turnstileToken) => {
  const [formData, setFormData] = useState({
    dni: "",
    celular: "",
    fechaNacimiento: "",
    situacionLaboral: "",
    term_y_cond: false,
    prevencion_fraudes: false,
  });
  const [errors, setErrors] = useState({
    dni: "",
    celular: "",
    fechaNacimiento: "",
    situacionLaboral: "",
  });
  // Flag de caracter inválido tipeado en celular. Se setea en handleChange
  // ANTES de strippear para que validateField pueda reportar con un mensaje
  // específico (ej: "incluiste +"). Sin este flag, strip + slice borraba el +
  // silenciosamente y el lead nunca entendía por qué fallaba la validación.
  // Valores: null | "plus" | "separators"
  const [celularInvalidChar, setCelularInvalidChar] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);

  // Carousel animation controlled by isSubmitting
  useEffect(() => {
    if (!isSubmitting) {
      setCurrentSlide(0);
      return;
    }
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SECURITY_SLIDES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isSubmitting]);

  const handleExpire = useCallback(() => {
    turnstileToken = "";
  }, []);

  const handleError = useCallback(() => {
    turnstileToken = "";
  }, []);

  const validateField = useCallback((name, value) => {
    const trimmed = value.trim();
    switch (name) {
      case "dni": {
        if (!trimmed) return "El DNI es requerido";
        if (!DNI_REGEX.test(trimmed)) return "El DNI debe tener 7 u 8 dígitos";
        return "";
      }
      case "celular": {
        if (!value) return "El celular es requerido";
        // Caracteres prohibidos: el flag se setea en handleChange antes de
        // strippear, así que ya sabemos si el usuario tipeó + o separadores.
        if (celularInvalidChar === "plus") {
          return "El símbolo + no está permitido. Ingresá sólo los 10 dígitos locales (ej: 1145678901).";
        }
        if (celularInvalidChar === "separators") {
          return "El celular sólo admite dígitos. Quita los espacios, guiones o paréntesis.";
        }
        if (value.length === 0) {
          return "Ingresá los 10 dígitos de tu celular";
        }
        if (value.length < 10) {
          return `Te faltan ${10 - value.length} dígitos. Ingresá los 10 dígitos de tu celular.`;
        }
        if (value.length > 10) {
          return "Ingresaste más de 10 dígitos. Verificá que sea un celular local sin código de país.";
        }
        if (!CELULAR_REGEX.test(value)) {
          return "Ingresá sólo los 10 dígitos de tu celular";
        }
        const prefixError = detectCelularPrefijoInvalido(value);
        if (prefixError) return prefixError;
        return "";
      }
      case "fechaNacimiento": {
        if (!value) return "La fecha de nacimiento es requerida";
        const fecha = new Date(value);
        if (isNaN(fecha.getTime())) return "Fecha inválida";
        if (fecha > new Date()) return "La fecha no puede ser futura";
        return "";
      }
      case "situacionLaboral": {
        if (!trimmed) return "Seleccioná tu situación laboral";
        if (!SITUACION_LABORAL_OPTIONS.some((o) => o.value === trimmed))
          return "Seleccioná una opción válida";
        return "";
      }
      default:
        return "";
    }
  }, [celularInvalidChar]);

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      let sanitized;
      if (name === "dni") {
        sanitized = value.replace(/\D/g, "").slice(0, 8);
      } else if (name === "celular") {
        // Detectamos caracteres prohibidos ANTES de strippearlos, así
        // validateField puede reportarlos con mensaje específico.
        if (value.includes("+")) {
          setCelularInvalidChar("plus");
        } else if (/[\s\-\(\)]/.test(value)) {
          setCelularInvalidChar("separators");
        } else {
          setCelularInvalidChar(null);
        }
        // Strip de no-dígitos + cap a 10. El cap es la red de seguridad final:
        // maxLength en el JSX evita tipear/pegar más de 10, pero esto protege
        // de inputs programáticos.
        sanitized = value.replace(/\D/g, "").slice(0, 10);
      } else {
        sanitized = value;
      }
      setFormData((prev) => ({ ...prev, [name]: sanitized }));
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    },
    [errors],
  );

  const handleTerminosChange = useCallback((e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {
      dni: validateField("dni", formData.dni),
      celular: validateField("celular", formData.celular),
      situacionLaboral: validateField("situacionLaboral", formData.situacionLaboral),
    };
    if (Number(formData.dni) >= 90000000) {
      newErrors.fechaNacimiento = validateField("fechaNacimiento", formData.fechaNacimiento);
    }
    setErrors(newErrors);
    return {
      isValid: !newErrors.dni && !newErrors.celular && !newErrors.fechaNacimiento && !newErrors.situacionLaboral,
      errors: newErrors,
    };
  }, [formData, validateField]);

  const crearLead = useCallback(
    async (turnstileToken, signal = null) => {
      const validation = validateForm();
      if (!validation.isValid) {
        // Age validation moved to backend (2026-09-02). El back siempre
        // responde HTTP 200 con cause=EDAD_INVALIDA; el handler de abajo
        // lo enruta a RejectedStep via onRejected().
        return { success: false, validationFailed: true };
      }
      setIsSubmitting(true);
      setSubmitError("");

      try {
        const showFechaNacimiento = Number(formData.dni) >= 90000000;
        const response = await LeadRegistrationService.crearLead(
          {
            dni: formData.dni.trim(),
            turnstileToken,
            celular: formData.celular,
            situacion_laboral: formData.situacionLaboral,
            term_y_cond: formData.term_y_cond,
            prevencion_fraudes: formData.prevencion_fraudes,
            ...(showFechaNacimiento &&
              formData.fechaNacimiento && {
                fecha_nacimiento: formData.fechaNacimiento,
              }),
          },
          signal,
        );

        // SUP-9: el DNI tiene múltiples identidades en el padrón. Devolvemos
        // el flag para que el caller (useOnboardingFlow) navegue al step de selección.
        // Devolvemos dni y celular para que el caller pueda guardarlos como
        // "pendingDni"/"pendingCelular" y re-llamar con selectedCuit luego.
       
        if (response?.requiresIdentitySelection === true) {
          return {
            success: true,
            data: {
              requiresIdentitySelection: true,
              identities: response.identities,
              dni: formData.dni.trim(),
              celular: formData.celular,
              situacionLaboral: formData.situacionLaboral,
            },
          };
        }

        if (response.success && response.data) {
          await setCookie(
            COOKIE_LEAD_TOKEN_CONFIG.NAME,
            response.data.token,
            COOKIE_LEAD_TOKEN_CONFIG.EXPIRY_MS,
          );

          if (response.data.analysisRequired) {
            return { success: false, analysis: true, data: response.data };
          }

          return {
            success: true,
            data: {
              lead: response.data.lead,
              token: response.data.token,
              scoringId: response.data.lead.id_scoring,
              nombreCompleto: response.data.lead?.nombre_completo || null,
            },
          };
        }
        const isScoringRechazado =
          response.cause === ERROR_CAUSE.SCORING_RECHAZADO ||
          (response.message && response.message.includes(ERROR_MESSAGE.SCORING_RECHAZADO));
        if (isScoringRechazado) {
          return { success: false, rejected: true };
        }
        if (response.cause === ERROR_CAUSE.EDAD_INVALIDA) {
          return { success: false, rejected: true };
        }
        if (response.cause === ERROR_CAUSE.SITUACION_LABORAL_NO_ELEGIBLE) {
          return { success: false, rejected: true };
        }
        // FALLECIDO: el back también devuelve esta cause para DNIs de personas
        // fallecidas. El usuario debe ir al RejectedStep igual.
        if (response.cause === ERROR_CAUSE.FALLECIDO) {
          return { success: false, rejected: true };
        }
        // El operador de backoffice rechazó el lead del DNI dentro de los últimos 45
        // días. El back siempre responde HTTP 200 con `cause` y `data.fecha_expiracion_bloqueo`.
        if (response.cause === ERROR_CAUSE.LEAD_REGISTRATION_RECHAZADO_RECIENTE) {
          return {
            success: false,
            rejected: true,
            fechaExpiracionBloqueo: response.data?.fecha_expiracion_bloqueo ?? null,
          };
        }
        setSubmitError(
          response.message ? `${response.message} 😊` : "Error al registrar. Intentá nuevamente.",
        );
        return { success: false };
      } catch (err) {
        console.error("LEAD_REGISTRATION_ERROR:", err);
        if (err.name === "AbortError") return { success: false, aborted: true };
        const msg = err.message ? `${err.message} 😊` : "Error de conexión. Intentá nuevamente.";
        setSubmitError(msg);
        return { success: false, error: msg };
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, validateForm, turnstileToken],
  );

  const showFechaNacimiento = Number(formData.dni) >= 90000000;
  const isFormValid =
    formData.dni.trim() !== "" &&
    formData.celular !== "" &&
    !errors.dni &&
    !errors.celular &&
    (!showFechaNacimiento || (formData.fechaNacimiento && !errors.fechaNacimiento)) &&
    formData.situacionLaboral !== "" &&
    turnstileToken !== "" &&
    formData.term_y_cond === true &&
    formData.prevencion_fraudes === true;

  return {
    formData,
    errors,
    isSubmitting,
    submitError,
    isFormValid,
    handleChange,
    handleTerminosChange,
    crearLead,
    currentSlide,
    setCurrentSlide,
    handleExpire,
    handleError,
  };
};
