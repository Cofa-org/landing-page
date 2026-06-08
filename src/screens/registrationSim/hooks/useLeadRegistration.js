import { useState, useCallback, useEffect } from "react";
import LeadRegistrationService from "../../../services/leadRegistrationService";
import { ERROR_CAUSE, ERROR_MESSAGE } from "../../../constants/error";
import { setCookie } from "../../../lib/utils";
import { COOKIE_LEAD_TOKEN_CONFIG } from "../../../constants/LOAN_SIM";
import { getFingerprint } from "../../../lib/fingerprint.js";

/**
 * Mapea el objeto ThumbmarkJS a un objeto plano huellaData.
 * @param {Object|null} fingerprint - Objeto returned by getFingerprint()
 * @returns {Object|null} huellaData plano o null
 */
const mapFingerprintToHuellaData = (fingerprint) => {
  if (!fingerprint) return null;
  return {
    thumbmark: fingerprint.thumbmark,
    visitor_id: fingerprint.visitorId,
    ip_address: fingerprint.info?.ip_address?.ip_address || null,
    pais: fingerprint.info?.country?.name || null,
    browser_name: fingerprint.components?.system?.browser?.name || null,
    browser_version: fingerprint.components?.system?.browser?.version || null,
    plataforma: fingerprint.components?.system?.platform || null,
    es_movil: fingerprint.components?.system?.mobile || false,
    zona_horaria: fingerprint.components?.locales?.timezone || null,
    uniqueness_score: fingerprint.info?.uniqueness?.score || null,
    es_vpn: fingerprint.info?.classification?.vpn || false,
    es_tor: fingerprint.info?.classification?.tor || false,
    es_bot: fingerprint.info?.classification?.bot || false,
    es_datacenter: fingerprint.info?.classification?.datacenter || false,
    nivel_peligro: fingerprint.info?.classification?.danger_level ?? null,
  };
};

const DNI_REGEX = /^\d{7,8}$/;
const NAME_REGEX = /^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]{2,50}$/;
const CELULAR_REGEX = /^549\d{10}$/;

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
  const [formData, setFormData] = useState({ dni: "", nombre_completo: "", apellido: "", celular: "" });
  const [errors, setErrors] = useState({ dni: "", nombre_completo: "", apellido: "", celular: "" });
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
      case "dni":
        if (!trimmed) return "El DNI es requerido";
        if (!DNI_REGEX.test(trimmed)) return "El DNI debe tener 7 u 8 dígitos";
        return "";
      case "nombre_completo":
        if (!trimmed) return "El nombre completo es requerido";
        if (!NAME_REGEX.test(trimmed))
          return "El nombre debe tener entre 2 y 50 caracteres alfabéticos";
        return "";
      case "apellido":
        if (!trimmed) return "El apellido es requerido";
        if (!NAME_REGEX.test(trimmed))
          return "El apellido debe tener entre 2 y 50 caracteres alfabéticos";
        return "";
      case "celular":
        if (formData.celular && !CELULAR_REGEX.test(formData.celular))
          return "El celular debe ser un número argentino válido (Ej: 5491123456789)";
        return "";
      default:
        return "";
    }
  }, []);

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      const sanitized = name === "dni" ? value.replace(/\D/g, "").slice(0, 8) : value;
      setFormData((prev) => ({ ...prev, [name]: sanitized }));
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    },
    [errors],
  );

  const validateForm = useCallback(() => {
    const newErrors = {
      dni: validateField("dni", formData.dni),
      nombre_completo: validateField("nombre_completo", formData.nombre_completo),
      apellido: validateField("apellido", formData.apellido),
      celular: validateField("celular", formData.celular),
    };
    setErrors(newErrors);
    return !newErrors.dni && !newErrors.nombre_completo && !newErrors.apellido;
  }, [formData, validateField]);

  const crearLead = useCallback(
    async (turnstileToken, signal = null) => {
      if (!validateForm()) return { success: false, validationFailed: true };
      setIsSubmitting(true);
      setSubmitError("");

      // Obtener fingerprint y mapear a huellaData
      let fingerprint = null;
      try {
        fingerprint = await getFingerprint({ dni: formData.dni.trim() });
      } catch (err) {
        console.warn("Fingerprint could not be obtained:", err);
      }
      const huellaData = mapFingerprintToHuellaData(fingerprint);
      const requestId = fingerprint?.requestId || null;

      try {
        const response = await LeadRegistrationService.crearLead(
          {
            dni: formData.dni.trim(),
            nombre_completo: formData.nombre_completo.trim(),
            apellido: formData.apellido.trim(),
            turnstileToken,
            huella_dispositivo: huellaData,
            request_id: requestId,
            celular: formData.celular,
          },
          signal,
        );

        if (response.success && response.data) {
          await setCookie(
            COOKIE_LEAD_TOKEN_CONFIG.NAME,
            response.data.token,
            COOKIE_LEAD_TOKEN_CONFIG.EXPIRY_MS,
          );
          return {
            success: true,
            data: {
              lead: response.data.lead,
              token: response.data.token,
              scoringId: response.data.lead.id_scoring,
              nombreCompleto: `${formData.nombre_completo.trim()} ${formData.apellido.trim()}`,
            },
          };
        }
        const isScoringRechazado =
          response.cause === ERROR_CAUSE.SCORING_RECHAZADO ||
          (response.message && response.message.includes(ERROR_MESSAGE.SCORING_RECHAZADO));
        if (isScoringRechazado) {
          return { success: false, rejected: true };
        }
        setSubmitError(response.message || "Error al registrar. Intentá nuevamente.");
        return { success: false };
      } catch (err) {
        console.error("LEAD_REGISTRATION_ERROR:", err);
        if (err.name === "AbortError") return { success: false, aborted: true };
        const isScoringRechazado =
          err.cause === ERROR_CAUSE.SCORING_RECHAZADO ||
          (err.message && err.message.includes(ERROR_MESSAGE.SCORING_RECHAZADO));
        if (isScoringRechazado) {
          return { success: false, rejected: true };
        }
        const msg = err.message || "Error de conexión. Intentá nuevamente.";
        setSubmitError(msg);
        return { success: false, error: msg };
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, validateForm, turnstileToken],
  );

  const isFormValid =
    formData.dni.trim() !== "" &&
    formData.nombre_completo.trim() !== "" &&
    formData.apellido.trim() !== "" &&
    !errors.dni &&
    !errors.nombre_completo &&
    !errors.apellido &&
    !errors.celular &&
    turnstileToken !== "";

  return {
    formData,
    errors,
    isSubmitting,
    submitError,
    isFormValid,
    handleChange,
    crearLead,
    currentSlide,
    setCurrentSlide,
    handleExpire,
    handleError,
  };
};
