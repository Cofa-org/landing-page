import React, { memo, useState } from "react";
import PropTypes from "prop-types";
import GenericForm from "../../../../Components/Forms/GenericForm/GenericForm.jsx";
import GenericInput from "../../../../Components/Forms/GenericInput/GenericInput.jsx";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import { useLeadRegistration } from "../../hooks/useLeadRegistration.js";
import styles from "./LeadRegistrationStep.module.css";
import Loader from "../../../../Components/Loader/Loader.jsx";

const LeadRegistrationStep = ({ onSuccess, onRejected, onNext, loading, error: externalError }) => {
  const [successMessage, setSuccessMessage] = useState("");
  const { formData, errors, isSubmitting, submitError, isFormValid, handleChange, crearLead } =
    useLeadRegistration();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    const result = await crearLead();
    if (result.success && onSuccess) {
      setSuccessMessage("¡Datos enviados correctamente!");
      onSuccess(result.data);
      if (onNext) onNext();
    } else if (result.rejected && onRejected) {
      onRejected();
    }
  };

  const isLoading = loading || isSubmitting;

  const displayError = submitError || externalError;

  return (
    <GenericForm
      title='Completá tus datos'
      description='Ingresá tu información personal para comenzar con la simulación de tu préstamo.'
      onSubmit={handleSubmit}
      // style={{ position: "relative" }}
    >
      {isSubmitting && (
        <div className={styles.processingOverlay}>
          <Loader />
          <p className={styles.processingTitle}>
            Estamos procesando tus datos<span className={`${styles.dots} ${styles.dot1}`}>.</span>
            <span className={styles.dot2}>.</span>
            <span className={styles.dot3}>.</span>
          </p>
          <p className={styles.processingSubtitle}>Esto puede tardar unos segundos</p>
        </div>
      )}
      <GenericInput
        label='DNI'
        name='dni'
        type='text'
        inputMode='numeric'
        value={formData.dni}
        onChange={handleChange}
        placeholder='Ej: 12345678'
        required
        error={errors.dni}
        autoComplete='off'
      />
      <GenericInput
        label='Nombre completo'
        name='nombre_completo'
        type='text'
        value={formData.nombre_completo}
        onChange={handleChange}
        placeholder='Ej: Juan Carlos'
        required
        error={errors.nombre_completo}
        autoComplete='off'
      />
      <GenericInput
        label='Apellido'
        name='apellido'
        type='text'
        value={formData.apellido}
        onChange={handleChange}
        placeholder='Ej: García'
        required
        error={errors.apellido}
        autoComplete='off'
      />
      <GenericButton
        type='submit'
        loading={isLoading}
        disabled={!isFormValid || isLoading}
      >
        Enviar
      </GenericButton>
      {displayError && (
        <p style={{ color: "#d32f2f", fontSize: "14px", textAlign: "center", marginTop: "8px" }}>
          {displayError}
        </p>
      )}
      {successMessage && (
        <p style={{ color: "#2e7d32", fontSize: "14px", textAlign: "center", marginTop: "8px" }}>
          {successMessage}
        </p>
      )}
    </GenericForm>
  );
};

LeadRegistrationStep.propTypes = {
  onSuccess: PropTypes.func,
  onRejected: PropTypes.func,
  onNext: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.string,
};

export default memo(LeadRegistrationStep);
