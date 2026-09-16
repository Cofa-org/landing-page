import React, { useEffect, memo } from "react";
import PropTypes from "prop-types";
import GenericForm from "../../../../Components/Forms/GenericForm/GenericForm";
import GenericInput from "../../../../Components/Forms/GenericInput/GenericInput";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import { useCBUValidation } from "../../hooks/useCBUValidation";
import styles from "./CBUValidation.module.css";

const CBUValidation = ({ onValidate, loading, error, onBack, isClient, existingCbu }) => {
  const {
    cbu,
    setCbu,
    isUpdating,
    accountType,
    setAccountType,
    termsAccepted,
    setTermsAccepted,
    structureError,
    bancoEncontrado,
    setBancoEncontrado,
    codigoBancoError,
    handleSubmit,
    handleToggleUpdate,
    CBU_LENGTH,
  } = useCBUValidation(isClient, existingCbu, onValidate);

  
  const termsCheckbox = (
    <div className={styles.termsContainer}>
      <label className={styles.termsLabel}>
        <input
          type='checkbox'
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className={styles.termsCheckbox}
        />
        <span>
          Acepto los{" "}
          <a
            href='https://cofa.com.ar/terminos-y-condiciones'
            target='_blank'
            rel='noopener noreferrer'
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
              disabled={loading || error || !termsAccepted}
            >
              Sí, es correcto
            </GenericButton>
            <GenericButton
              type='button'
              variant='outline'
              onClick={handleToggleUpdate}
              className={styles.flexButton}
              disabled={loading || error || !termsAccepted}
            >
              No, ingresar otro
            </GenericButton>
          </div>
          {error && (
            <>
              <span className={styles.errorText}>{error}</span>
              <GenericButton
                type='button'
                variant='secondary'
                onClick={() => window.open("https://wa.me/5491137570853", "_blank", "noopener,noreferrer")}
                style={{ flex: 1 }}
              >
                Comunicarse con un asesor
              </GenericButton>
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
              <label className={styles.bancoLabel}>
                {accountType.toUpperCase()} {`${cbu.length}/22`}
              </label>
              {bancoEncontrado && (
                <span className={styles.bancoName}>✓ {bancoEncontrado?.razon_social}</span>
              )}
            </div>
            <GenericInput
              label=''
              name={accountType}
              type='text'
              value={cbu}
              onChange={(e) => setCbu(e.target.value)}
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
              loading ||
              !termsAccepted ||
              (accountType === "cvu" && structureError)
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
};

export default memo(CBUValidation);
