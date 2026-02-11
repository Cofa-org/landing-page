import React, { useState } from "react";
import PropTypes from "prop-types";
import GenericForm from "../../../../Components/Forms/GenericForm/GenericForm";
import GenericInput from "../../../../Components/Forms/GenericInput/GenericInput";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import { CBU_CONFIG } from "../../../../constants/LOAN_SIM.js";

import styles from "./CBUValidation.module.css";

const CBUValidation = ({ onValidate, loading, error, onBack, isClient, existingCbu }) => {
  const [cbu, setCbu] = useState("");
  const [isUpdating, setIsUpdating] = useState(!isClient);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isClient && !isUpdating) {
      onValidate(existingCbu);
    } else if (cbu) {
      onValidate(cbu);
    }
  };

  const handleToggleUpdate = () => {
    setIsUpdating(true);
    setCbu("");
  };

  return (
    <GenericForm
      title='Validá tu CBU'
      description={
        isClient && !isUpdating
          ? "Verificá que tu CBU sea el correcto para recibir el préstamo."
          : `Ingresá los ${CBU_CONFIG.CBU_LENGTH} dígitos de tu CBU para validar tu cuenta bancaria.`
      }
      onSubmit={handleSubmit}
      onBack={onBack}
      className={styles.formOverride}
    >
      {isClient && !isUpdating ? (
        <div className={styles.clientContainer}>
          <div className={styles.cbuBox}>{existingCbu}</div>
          <p className={styles.helperText}>¿Es este tu CBU correcto?</p>
          <div className={styles.buttonGroup}>
            <GenericButton
              type='submit'
              loading={loading}
              className={styles.flexButton}
            >
              Sí, es correcto
            </GenericButton>
            <GenericButton
              type='button'
              variant='outline'
              onClick={handleToggleUpdate}
              className={styles.flexButton}
            >
              No, ingresar otro
            </GenericButton>
          </div>
        </div>
      ) : (
        <>
          <GenericInput
            label='CBU'
            name='cbu'
            type='text'
            value={cbu}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, CBU_CONFIG.CBU_LENGTH);
              setCbu(val);
            }}
            placeholder='0000000000000000000000'
            required
            error={error}
            maxLength={CBU_CONFIG.CBU_LENGTH}
          />
          <GenericButton
            type='submit'
            loading={loading}
            disabled={cbu.length !== CBU_CONFIG.CBU_LENGTH}
          >
            Validar CBU
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

export default CBUValidation;
