import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MailService from "../../../services/mailService.js";

export const useReqAutoridadesForm = () => {
  const [isSent, setIsSent] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "success" });
  const navigate = useNavigate();

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    const formData = new FormData();
    
    Object.keys(values).forEach(key => {
      if (key !== 'files') {
        if (Array.isArray(values[key])) {
          formData.append(key, values[key].join(", "));
        } else {
          formData.append(key, values[key]);
        }
      }
    });

    if (values.files && values.files.length > 0) {
      values.files.forEach(file => {
        const blob = new Blob([new Uint8Array(file.buffer)], { type: "application/octet-stream" });
        formData.append("archivos", blob, file.originalname);
      });
    }

    try {
      const response = await MailService.sendMail("AUTORIDADES", formData);
      
      // ✅ GTM Conversion Event
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'solicitud_prestamo_ok', // Usando el mismo nombre del informe para compatibilidad o estandarizar
        conversion_value: 0, 
        currency: 'ARS'
      });

      setNotification({
        show: true,
        message: "Solicitud recibida correctamente. COFA analizará la validez formal del requerimiento y dará respuesta por los canales correspondientes",
        type: "success",
      });
      setIsSent(true);
      resetForm();
      setTimeout(() => {
        navigate("/");
      }, 4000);
    } catch (error) {
      setNotification({
        show: true,
        message: error.message || "Error al enviar el requerimiento",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const validate = (values) => {
    const errors = {};
    if (!values.declaracion_final) {
      errors.declaracion_final = "Debe aceptar la declaración final para enviar el requerimiento.";
    }
    return errors;
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  return {
    isSent,
    notification,
    handleSubmit,
    validate,
    closeNotification
  };
};
