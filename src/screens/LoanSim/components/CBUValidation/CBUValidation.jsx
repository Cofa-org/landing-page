import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import GenericForm from "../../../../Components/Forms/GenericForm/GenericForm";
import GenericInput from "../../../../Components/Forms/GenericInput/GenericInput";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import { CBU_CONFIG } from "../../../../constants/LOAN_SIM.js";
import styles from "./CBUValidation.module.css";

const CBUValidation = ({
  onValidate,
  loading,
  error,
  onBack,
  isClient,
  existingCbu,
  bancoEncontrado,
  setBancoEncontrado,
  codigoBancoError,
  setCodigoBancoError,
  validandoBanco,
  validarCodigoBanco,
}) => {
  const [cbu, setCbu] = useState("");
  const [isUpdating, setIsUpdating] = useState(!isClient);
  const [accountType, setAccountType] = useState("cbu");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [structureError, setStructureError] = useState(null);

  const CBU_LENGTH = accountType === 'cvu'
    ? CBU_CONFIG.CVU_LENGTH
    : CBU_CONFIG.CBU_LENGTH;

  const PREFIX_LENGTH = accountType === 'cvu' ? 8 : 3;
  const prefix = cbu.length >= PREFIX_LENGTH
    ? cbu.slice(0, PREFIX_LENGTH)
    : cbu.length === 0
      ? ""
      : null;

  const validateCvuStructure = (value) => {
    
    if (value.slice(0, 3) !== CBU_CONFIG.CVU_PREFIX) {
      return "El CVU debe comenzar con 000";
    }
    if (value[CBU_CONFIG.CVU_CHECK_DIGIT_POSITION] !== CBU_CONFIG.CVU_CHECK_DIGIT_VALUE) {
      return "El octavo dígito del CVU debe ser 1";
    }
    const hasExcessDigits = value.length > CBU_LENGTH;
    if (hasExcessDigits) {
      return `El ${accountType.toUpperCase()} debe tener ${CBU_LENGTH} dígitos`;
    }
    return null;
  };

  useEffect(() => {
    const shouldValidate = !isClient || (isClient && isUpdating);

    if (prefix !== null && prefix?.length === PREFIX_LENGTH && shouldValidate && cbu?.length >= 8 && !structureError) {
      console.log("ENTRO")
      validarCodigoBanco(prefix, accountType);
    }
  }, [prefix, isClient, isUpdating, accountType, validarCodigoBanco, cbu.length, CBU_LENGTH]);

  useEffect(() => {
    setStructureError(null);
  }, [accountType]);

  useEffect(() => {
    setBancoEncontrado(null);
    setCodigoBancoError(null);
  }, [accountType]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isClient && !isUpdating) {
      onValidate(existingCbu, "cbu");
    } else if (cbu) {
      onValidate(cbu, accountType);
    }
  };

  const handleToggleUpdate = () => {
    setIsUpdating(true);
    setCbu("");
    setAccountType("cbu");
  };

  const termsCheckbox = (
    <div className={styles.termsContainer}>
      <label className={styles.termsLabel}>
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className={styles.termsCheckbox}
        />
        <span>
          Acepto los{" "}
          <a
            href="https://cofa.com.ar/terminos-y-condiciones"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.termsLink}
          >
            términos y condiciones
          </a>
        </span>
      </label>
    </div>
  );

  return (
    <GenericForm
      title='Validá tu CBU'
      description={
        isClient && !isUpdating
          ? "Verificá que tu CBU sea el correcto para recibir el préstamo."
          : `Ingresá los ${CBU_LENGTH} dígitos de tu ${accountType.toUpperCase()} para validar tu cuenta bancaria.`
      }
      onSubmit={handleSubmit}
      onBack={onBack}
      className={styles.formOverride}
    >
      {isClient && !isUpdating ? (
        <div className={styles.clientContainer}>
          <div className={styles.cbuBox}>{existingCbu}</div>
          <p className={styles.helperText}>¿Es este tu CBU correcto?</p>
          {termsCheckbox}
          <div className={styles.buttonGroup}>
            <GenericButton
              type='submit'
              loading={loading}
              className={styles.flexButton}
              disabled={loading || validandoBanco || codigoBancoError || error || !termsAccepted}
            >
              Sí, es correcto
            </GenericButton>
            <GenericButton
              type='button'
              variant='outline'
              onClick={handleToggleUpdate}
              className={styles.flexButton}
              disabled={loading || validandoBanco || codigoBancoError || error || !termsAccepted}
            >
              No, ingresar otro
            </GenericButton>
          </div>
          {error && (
            <>
              <span className={styles.errorText}>{error}</span>
              <button
                className='primary-btn'
                onClick={() => (window.location.href = "http://wa.me/5491137570853")}
                style={{ flex: 1 }}
              >
                Comunicarse con un asesor
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          {isClient && isUpdating && (
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type='radio'
                  name='accountType'
                  value='cbu'
                  checked={accountType === "cbu"}
                  onChange={(e) => {
                    setAccountType(e.target.value);
                    setCbu("");
                  }}
                />
                <span>CBU</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type='radio'
                  name='accountType'
                  value='cvu'
                  checked={accountType === "cvu"}
                  onChange={(e) => {
                    setAccountType(e.target.value);
                    setCbu("");
                  }}
                />
                <span>CVU</span>
              </label>
            </div>
          )}
          <div>
            <div className={styles.bancoContainer}>
              <label className={styles.bancoLabel}>{accountType.toUpperCase()} {`${cbu.length}/22`}</label>
              {bancoEncontrado && (
                <span className={styles.bancoName}>✓ {bancoEncontrado?.razon_social}</span>
              )}
            </div>
            <GenericInput
              label=''
              name={accountType}
              type='text'
              value={cbu}
              onChange={(e) => {
                const rawValue = e.target.value;
                if(rawValue.length === 0) {
                  setCodigoBancoError(null)
                  setStructureError(null)
                  setBancoEncontrado(null)
                }
                const digitsOnly = rawValue.replace(/\D/g, "");
                setCbu(digitsOnly);
                if (accountType === 'cvu' && digitsOnly.length >= 8) {
                  const structureError = validateCvuStructure(digitsOnly);
                  setStructureError(structureError);
                } else {
                  setStructureError(null);
                }
              }}
              placeholder='0000000000000000000000'
              required
              error={error || codigoBancoError || structureError}
            />
          </div>
          {termsCheckbox}
          <GenericButton
            type='submit'
            loading={loading}
            disabled={
              cbu.length !== CBU_LENGTH ||
              validandoBanco ||
              loading ||
              codigoBancoError ||
              !termsAccepted ||
              (accountType === 'cvu' && structureError)
            }
          >
            Validar {accountType.toUpperCase()}
          </GenericButton>
        </>
      )}
    </GenericForm>
  );
};

CBUValidation.propTypes = {
  onValidate: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  isClient: PropTypes.bool,
  existingCbu: PropTypes.string,
  bancoEncontrado: PropTypes.object,
  codigoBancoError: PropTypes.string,
  validandoBanco: PropTypes.bool,
  validarCodigoBanco: PropTypes.func.isRequired,
  scoringId: PropTypes.string,
};

export default CBUValidation;
