import React, { useState } from "react";
import PropTypes from "prop-types";
import GenericForm from "../../../../Components/Forms/GenericForm/GenericForm";
import GenericInput from "../../../../Components/Forms/GenericInput/GenericInput";
import GenericButton from "../../../../Components/Forms/GenericButton/GenericButton";

const EmailValidation = ({ onValidate, loading, error }) => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      onValidate(email);
    }
  };

  return (
    <GenericForm
      title='Validá tu Email'
      description='Necesitamos validar tu correo electrónico para continuar con la solicitud.'
      onSubmit={handleSubmit}
    >
      <GenericInput
        label='Correo electrónico'
        name='email'
        type='email'
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder='ejemplo@correo.com'
        required
        error={error}
      />
      <GenericButton
        type='submit'
        loading={loading}
        disabled={!email}
      >
        Validar Email
      </GenericButton>
    </GenericForm>
  );
};

EmailValidation.propTypes = {
  onValidate: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
};

export default EmailValidation;
