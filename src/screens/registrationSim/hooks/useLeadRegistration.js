import { useState, useCallback, useEffect } from "react";
import LeadRegistrationService from "../../../services/leadRegistrationService";
import { ERROR_CAUSE, ERROR_MESSAGE } from "../../../constants/error";
import { setCookie } from "../../../lib/utils";
import { COOKIE_LEAD_TOKEN_CONFIG } from "../../../constants/LOAN_SIM";

const DNI_REGEX = /^\d{7,8}$/;
const NAME_REGEX = /^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]{2,50}$/;

export const SECURITY_SLIDES = [
  {
    title: "Detección de Fraude Inteligente",
    description: "Analizamos patrones en tiempo real utilizando inteligencia artificial para evitar transacciones no autorizadas.",
    image: "/img/cofa-tips-2.webp"
  },
  {
    title: "Protección Financiera Activa",
    description: "Tu dinero y tus datos están respaldados por protocolos internacionales de seguridad financiera.",
    image: "/img/cofa-tips-3.webp"
  },
  {
    title: "Encriptación de Nivel Bancario",
    description: "Ciframos cada dato enviado con estándares AES-256 de nivel bancario para garantizar la total privacidad de tu información.",
    image: "/img/cofa-tips-4.webp"
  },
  {
    title: "Verificación de Identidad Digital",
    description: "Validamos tu identidad de forma segura para garantizar un proceso transparente y prevenir la suplantación.",
    image: "/img/cofa-tips-2.webp"
  },
  {
    title: "Tranquilidad y Confianza Cofa",
    description: "Cofa es una plataforma transparente, segura y comprometida con el desarrollo de tu salud financiera.",
    image: "/img/cofa-tips-3.webp"
  }
];

export const useLeadRegistration = (turnstileToken) => {
  const [formData, setFormData] = useState({ dni: "", nombre_completo: "", apellido: "" });
  const [errors, setErrors] = useState({ dni: "", nombre_completo: "", apellido: "" });
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
    };
    setErrors(newErrors);
    return !newErrors.dni && !newErrors.nombre_completo && !newErrors.apellido;
  }, [formData, validateField]);

  const crearLead = useCallback(
    async (turnstileToken, signal = null) => {
      if (!validateForm()) return { success: false, validationFailed: true };
      setIsSubmitting(true);
      setSubmitError("");
      try {
        const response = await LeadRegistrationService.crearLead(
          {
            dni: formData.dni.trim(),
            nombre_completo: formData.nombre_completo.trim(),
            apellido: formData.apellido.trim(),
            turnstileToken,
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
};;