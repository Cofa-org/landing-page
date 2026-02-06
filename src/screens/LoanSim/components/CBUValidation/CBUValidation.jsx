import React, { useState } from "react";
import PropTypes from "prop-types";
import GenericForm from "../../../../Components/Forms/GenericForm/GenericForm";
import GenericInput from "../../../../Components/Forms/GenericInput/GenericInput";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import { CBU_CONFIG } from "../../../../constants/LOAN_SIM.js";

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
      style={{
        width: "100%",
        height: "100%",
        gap: "4rem",
        margin: "0px",
        maxWidth: "none",
        minHeight: "760px",
        justifyContent: "center",
      }}
    >
      {isClient && !isUpdating ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "2rem",
            width: "100%",
            textAlign: "center",
          }}
        >
          <div
            style={{
              padding: "2rem",
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: "1.5rem",
              letterSpacing: "0.2rem",
              fontWeight: "bold",
              color: "#fff",
            }}
          >
            {existingCbu}
          </div>
          <p style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "1rem" }}>
            ¿Es este tu CBU correcto?
          </p>
          <div style={{ display: "flex", gap: "1rem" }}>
            <GenericButton
              type='submit'
              loading={loading}
              style={{ flex: 1 }}
            >
              Sí, es correcto
            </GenericButton>
            <GenericButton
              type='button'
              variant='outline'
              onClick={handleToggleUpdate}
              style={{ flex: 1 }}
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
