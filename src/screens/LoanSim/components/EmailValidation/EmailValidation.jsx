import React, { useState } from "react";
import PropTypes from "prop-types";
import GenericForm from "../../../../Components/Forms/GenericForm/GenericForm";
import GenericInput from "../../../../Components/Forms/GenericInput/GenericInput";
import GenericButton from "../../../../Components/Forms/GenericButton/GenericButton";

const EmailValidation = ({ onValidate, onBack, loading, error }) => {
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
      onBack={onBack}
      style={{
        width: "100%",
        height: "100%",
        gap: "5rem",
        margin: "0px",
        maxWidth: "none",
        minHeight: "760px",
        justifyContent: "center",
      }}
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
  onBack: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.string,
};

export default EmailValidation;
