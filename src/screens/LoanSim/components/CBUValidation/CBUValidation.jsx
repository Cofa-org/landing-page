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
  codigoBancoError,
  validandoBanco,
  validarCodigoBanco,
}) => {
  const [cbu, setCbu] = useState("");
  const [isUpdating, setIsUpdating] = useState(!isClient);
  const [accountType, setAccountType] = useState("cbu");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const prefix = cbu.length >= 3 ? cbu.slice(0, 3) : cbu.length === 0 ? "" : null;

  useEffect(() => {
    if (!isClient || (isUpdating && accountType === "cbu")) {
      if (prefix !== null) {
        validarCodigoBanco(prefix);
      }
    }
  }, [prefix, isClient, isUpdating, accountType, validarCodigoBanco]);

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
            href="https://cofa.com.ar/terminos-y-condiciones/#top"
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
          : `Ingresá los ${CBU_CONFIG.CBU_LENGTH} dígitos de tu ${accountType.toUpperCase()} para validar tu cuenta bancaria.`
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
          {termsCheckbox}
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
              <label className={styles.bancoLabel}>{accountType.toUpperCase()}</label>
              {bancoEncontrado && (
                <span className={styles.bancoName}>✓ {bancoEncontrado.descripcion}</span>
              )}
            </div>
            <GenericInput
              label=''
              name={accountType}
              type='text'
              value={cbu}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, CBU_CONFIG.CBU_LENGTH);
                setCbu(val);
              }}
              placeholder='0000000000000000000000'
              required
              error={error || codigoBancoError}
              maxLength={CBU_CONFIG.CBU_LENGTH}
            />
          </div>
          <GenericButton
            type='submit'
            loading={loading}
            disabled={
              cbu.length !== CBU_CONFIG.CBU_LENGTH ||
              validandoBanco ||
              loading ||
              codigoBancoError ||
              !termsAccepted
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
