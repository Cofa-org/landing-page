import { useState, useCallback } from "react";

// Patrones comunes de errores en dominios
const COMMON_DOMAIN_ERRORS = {
  ".con": { correct: ".com", message: "¿Quisiste escribir .com?" },
  ".cmo": { correct: ".com", message: "¿Quisiste escribir .com?" },
  ".cm": { correct: ".com", message: "¿Quisiste escribir .com?" },
  ".comm": { correct: ".com", message: "¿Quisiste escribir .com?" },
  ".ko": { correct: ".com", message: "¿Quisiste escribir .com?" },
};

// Expresión regular para validar formato básico de email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const useEmailValidation = () => {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const validateEmail = useCallback((value) => {
    const trimmedEmail = value.trim();

    // Si está vacío, no mostrar error
    if (!trimmedEmail) {
      setErrorMessage("");
      return true;
    }

    // Verificar formato básico
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setErrorMessage("Ingresa una dirección de email válida");
      return false;
    }

    // Verificar si tiene espacios
    if (trimmedEmail.includes(" ")) {
      setErrorMessage("El email no puede contener espacios");
      return false;
    }

    // Verificar errores comunes de dominio
    const lowerEmail = trimmedEmail.toLowerCase();
    for (const [error, correction] of Object.entries(COMMON_DOMAIN_ERRORS)) {
      if (lowerEmail.endsWith(error)) {
        setErrorMessage(
          `Parece que hay un error en el tu dirección de email 🫣. ${correction.message}`,
        );
        return false;
      }
    }

    // Si llegamos aquí, el email es válido
    setErrorMessage("");
    return true;
  }, []);

  const handleEmailChange = useCallback(
    (value) => {
      setEmail(value);
      validateEmail(value);
    },
    [validateEmail],
  );

  const isValid = email.trim() !== "" && !errorMessage;

  return {
    email,
    setEmail: handleEmailChange,
    errorMessage,
    isValid,
  };
};
