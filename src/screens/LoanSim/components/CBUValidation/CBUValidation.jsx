import React, { useEffect, memo } from "react";
import PropTypes from "prop-types";
import GenericForm from "../../../../Components/Forms/GenericForm/GenericForm";
import GenericInput from "../../../../Components/Forms/GenericInput/GenericInput";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import { useCBUValidation } from "../../hooks/useCBUValidation";
import styles from "./CBUValidation.module.css";

const CBUValidation = ({
  onValidate,
  loading,
  error,
  onBack,
  isClient,
  existingCbu,
  pendingCbu,
  cbuValidado,
  pendingAccountType,
}) => {
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
  } = useCBUValidation(isClient, existingCbu, onValidate, {
    pendingCbu,
    cbuValidado,
    pendingAccountType,
  });

  // Plan 2026-10-20: el asesor ya validó el cambio de cuenta bancaria.
  // Mostramos el CBU/CVU que ingressó el cliente (no el del ERP) y un botón
  // para continuar. `onValidate` re-valida contra el ERP, pero el back ya no
  // re-gatea la cuenta porque `cbu_validado_por` quedó seteado.
  if (cbuValidado && pendingCbu) {

    return (
      <GenericForm
        title={`Tu cuenta fue validada.`}
        description='Confirmamos el CBU/CVU que ingresaste. Presioná “Continuar” para seguir con tu solicitud.'
        onSubmit={handleSubmit}
        className={styles.formOverride}
      >
        <div
          className={styles.clientContainer}
          data-testid='cbu-validation-approved'
        >
          <div className={styles.cbuBox}>{pendingCbu}</div>
          {error && <span className={styles.errorText}>{error}</span>}
          <GenericButton
            // `type="button"` es OBLIGATORIO: este botón vive dentro del
            // `<form onSubmit={handleSubmit}>` de `GenericForm` → con
            // `type="submit"` el click dispara el `onClick` Y el submit del
            // form, y `onValidate` se llama DOS veces.
            type='button'
            variant='primary'
            onClick={handleSubmit}
            loading={loading}
            // `GenericButton` reemplaza el children por un spinner `aria-hidden`
            // cuando entra en loading → el botón quedaría sin nombre accesible.
            // El `aria-label` mantiene el nombre y el `aria-busy` expone el
            // estado "ocupado".
            aria-label='Continuar'
            aria-busy={loading || undefined}
            data-testid='cbu-validation-approved-submit'
          >
            Continuar
          </GenericButton>
        </div>
      </GenericForm>
    );
  }

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
  // Plan 2026-10-20: cuenta que ingressó el cliente y validó el asesor.
  pendingCbu: PropTypes.string,
  cbuValidado: PropTypes.bool,
  pendingAccountType: PropTypes.oneOf(["cbu", "cvu"]),
};

CBUValidation.defaultProps = {
  pendingCbu: null,
  cbuValidado: false,
  pendingAccountType: "cbu",
};

export default memo(CBUValidation);
