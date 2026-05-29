import { useState, useCallback } from "react";
import LeadRegistrationService from "../../../services/leadRegistrationService";

const DNI_REGEX = /^\d{7,8}$/;
const NAME_REGEX = /^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]{2,50}$/;

export const useLeadRegistration = () => {
  const [formData, setFormData] = useState({ dni: "", nombre_completo: "", apellido: "" });
  const [errors, setErrors] = useState({ dni: "", nombre_completo: "", apellido: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const validateField = useCallback((name, value) => {
    const trimmed = value.trim();
    switch (name) {
      case "dni":
        if (!trimmed) return "El DNI es requerido";
        if (!DNI_REGEX.test(trimmed)) return "El DNI debe tener 7 u 8 dígitos";
        return "";
      case "nombre_completo":
        if (!trimmed) return "El nombre completo es requerido";
        if (!NAME_REGEX.test(trimmed)) return "El nombre debe tener entre 2 y 50 caracteres alfabéticos";
        return "";
      case "apellido":
        if (!trimmed) return "El apellido es requerido";
        if (!NAME_REGEX.test(trimmed)) return "El apellido debe tener entre 2 y 50 caracteres alfabéticos";
        return "";
      default:
        return "";
    }
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    const sanitized = name === "dni" ? value.replace(/\D/g, "").slice(0, 8) : value;
    setFormData((prev) => ({ ...prev, [name]: sanitized }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }, [errors]);

  const validateForm = useCallback(() => {
    const newErrors = {
      dni: validateField("dni", formData.dni),
      nombre_completo: validateField("nombre_completo", formData.nombre_completo),
      apellido: validateField("apellido", formData.apellido),
    };
    setErrors(newErrors);
    return !newErrors.dni && !newErrors.nombre_completo && !newErrors.apellido;
  }, [formData, validateField]);

  const crearLead = useCallback(async (signal = null) => {
    if (!validateForm()) return { success: false };
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const response = await LeadRegistrationService.crearLead(
        { dni: formData.dni.trim(), nombre_completo: formData.nombre_completo.trim(), apellido: formData.apellido.trim() },
        signal
      );
      if (response.success && response.data) {
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
      setSubmitError(response.message || "Error al registrar. Intentá nuevamente.");
      return { success: false };
    } catch (err) {
      if (err.name === "AbortError") return { success: false, aborted: true };
      const msg = err.message || "Error de conexión. Intentá nuevamente.";
      setSubmitError(msg);
      return { success: false, error: msg };
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm]);

  const isFormValid = formData.dni.trim() !== "" && formData.nombre_completo.trim() !== "" && formData.apellido.trim() !== "" && !errors.dni && !errors.nombre_completo && !errors.apellido;

  return { formData, errors, isSubmitting, submitError, isFormValid, handleChange, crearLead };
};