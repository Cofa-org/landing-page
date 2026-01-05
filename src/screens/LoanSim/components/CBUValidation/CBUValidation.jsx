import React, { useState } from "react";
import PropTypes from "prop-types";
import GenericForm from "../../../../Components/Forms/GenericForm/GenericForm";
import GenericInput from "../../../../Components/Forms/GenericInput/GenericInput";
import GenericButton from "../../../../Components/Forms/GenericButton/GenericButton";

const CBUValidation = ({ onValidate, loading, error }) => {
  const [cbu, setCbu] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cbu) {
      onValidate(cbu);
    }
  };

  return (
    <GenericForm
      title='Validá tu CBU'
      description='Ingresá los 22 dígitos de tu CBU para validar tu cuenta bancaria.'
      onSubmit={handleSubmit}
    >
      <GenericInput
        label='CBU'
        name='cbu'
        type='text'
        value={cbu}
        onChange={(e) => {
          const val = e.target.value.replace(/\D/g, "").slice(0, 22);
          setCbu(val);
        }}
        placeholder='0000000000000000000000'
        required
        error={error}
        maxLength={22}
      />
      <GenericButton
        type='submit'
        loading={loading}
        disabled={cbu.length !== 22}
      >
        Validar CBU
      </GenericButton>
    </GenericForm>
  );
};

CBUValidation.propTypes = {
  onValidate: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
};

export default CBUValidation;
