import { useState, useEffect, useCallback } from "react";
import SimuladorService from "../../../services/simuladorService";
import { CBU_CONFIG } from "../../../constants/LOAN_SIM.js";

export const useCBUValidation = (isClient, existingCbu, onValidate) => {
  const [cbu, setCbu] = useState("");
  const [isUpdating, setIsUpdating] = useState(!isClient);
  const [accountType, setAccountType] = useState("cbu");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [structureError, setStructureError] = useState(null);
  const [bancoEncontrado, setBancoEncontrado] = useState(null);
  const [codigoBancoError, setCodigoBancoError] = useState(null);

  const CBU_LENGTH = accountType === "cvu"
    ? CBU_CONFIG.CVU_LENGTH
    : CBU_CONFIG.CBU_LENGTH;

  const PREFIX_LENGTH = accountType === "cvu" ? 8 : 3;

  const prefix = cbu.length >= PREFIX_LENGTH
    ? cbu.slice(0, PREFIX_LENGTH)
    : cbu.length === 0
      ? ""
      : null;

  const validateCvuCbuStructure = useCallback((value, accType) => {
    if (accType === "cvu" && value.slice(0, 3) !== CBU_CONFIG.CVU_PREFIX) {
      return "El CVU debe comenzar con 000";
    }
    if (accType === "cvu" && value[CBU_CONFIG.CVU_CHECK_DIGIT_POSITION] !== CBU_CONFIG.CVU_CHECK_DIGIT_VALUE) {
      return "El octavo dígito del CVU debe ser 1";
    }
    const hasExcessDigits = value.length > CBU_LENGTH;
    if (hasExcessDigits) {
      return `El ${accountType.toUpperCase()} debe tener ${CBU_LENGTH} dígitos`;
    }
    return null;
  }, [accountType, CBU_LENGTH]);

  const validarCodigoBanco = useCallback(async (codigoValue, accType = "cbu") => {
    const longitudMinima = accType === "cvu" ? 8 : 3;
    if (codigoValue && codigoValue.length === longitudMinima) {

      try {
        const response = await SimuladorService.validarCodigoBanco(codigoValue, accType);
        if (response.success && response.exists) {
          setBancoEncontrado(response.data);
          setCodigoBancoError(null);
        } else {
          setBancoEncontrado(null);
          // El backend retorna success: false con el mensaje "Alguno de los dígitos
          // ingresados no es correcto" (o el específico para CVU) cuando el código
          // no matchea ningún banco registrado. Mostramos ese mensaje con emoji.
          setCodigoBancoError(
            response.message
              ? `${response.message} 😊`
              : "Alguno de los dígitos ingresados no es correcto",
          );
        }
      } catch (err) {
        console.error("Error validando código bancario:", err);
        setBancoEncontrado(null);
        setCodigoBancoError("Error al validar el código bancario");
      } 
    }
  }, []);

  useEffect(() => {
    const shouldValidate = !isClient || (isClient && isUpdating);
    if (prefix !== null && prefix?.length === PREFIX_LENGTH && shouldValidate && cbu?.length >= 8 && !structureError) {
      validarCodigoBanco(prefix, accountType);
    }
  }, [prefix, isClient, isUpdating, accountType, validarCodigoBanco, cbu.length, structureError, PREFIX_LENGTH]);

  useEffect(() => {
    setStructureError(null);
  }, [accountType]);

  useEffect(() => {
    setBancoEncontrado(null);
    setCodigoBancoError(null);
  }, [accountType]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (isClient && !isUpdating) {
      onValidate(existingCbu, "cbu");
    } else if (cbu) {
      onValidate(cbu, accountType);
    }
  }, [isClient, isUpdating, existingCbu, cbu, accountType, onValidate]);

  const handleToggleUpdate = useCallback(() => {
    setIsUpdating(true);
    setCbu("");
    setAccountType("cbu");
  }, []);

  const handleCbuChange = useCallback((rawValue) => {
   
    if (rawValue.length === 0) {
      setCodigoBancoError(null);
      setStructureError(null);
      setBancoEncontrado(null);
    }
    const digitsOnly = rawValue.replace(/\D/g, "");
    setCbu(digitsOnly);
    if (digitsOnly.length >= 8) {
      const err = validateCvuCbuStructure(digitsOnly, accountType);
      setStructureError(err);
    } else {
      setStructureError(null);
    }
  }, [accountType, validateCvuCbuStructure]);

  return {
    cbu,
    setCbu: handleCbuChange,
    isUpdating,
    accountType,
    setAccountType,
    termsAccepted,
    setTermsAccepted,
    structureError,
    bancoEncontrado,
    codigoBancoError,
    setBancoEncontrado,
    setCodigoBancoError,
    validarCodigoBanco,
    handleSubmit,
    handleToggleUpdate,
    CBU_LENGTH,
    PREFIX_LENGTH,
    prefix,
  };
};