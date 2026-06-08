import React, { memo, useRef, useState } from "react";
import PropTypes from "prop-types";
import GenericForm from "../../../../Components/Forms/GenericForm/GenericForm.jsx";
import GenericInput from "../../../../Components/Forms/GenericInput/GenericInput.jsx";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import { useLeadRegistration, SECURITY_SLIDES } from "../../hooks/useLeadRegistration.js";
import Turnstile from "../../../../Components/Turnstile/Turnstile.jsx";
import { TURNSTILE_SITE_KEY } from "../../../../config.js";
import styles from "./LeadRegistrationStep.module.css";

const LeadRegistrationStep = ({ onSuccess, onRejected, onNext, loading, error: externalError }) => {
  const [successMessage, setSuccessMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef(null);
  const {
    formData,
    errors,
    isSubmitting,
    submitError,
    isFormValid,
    handleChange,
    crearLead,
    currentSlide,
    setCurrentSlide,
    handleExpire,
    handleError,
  } = useLeadRegistration(turnstileToken);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!turnstileToken) return;
    if (honeypot) return; // Silently ignore — probable bot

    setSuccessMessage("");

    const result = await crearLead(turnstileToken);

    if (result.success && onSuccess) {
      setSuccessMessage("¡Datos enviados correctamente!");
      onSuccess(result.data);
      if (onNext) onNext();
      return;
    }

    turnstileRef.current?.reset();
    setTurnstileToken("");

    if (result.rejected && onRejected) {
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
      className={styles.formTemplateContainer}
      children_className={styles.formTemplate}
    >
      {isSubmitting && (
        <div className={styles.processingOverlay}>
          <div className={styles.carouselContainer}>
            <div className={styles.carouselSlide}>
              <div className={styles.illustrationWrapper}>
                <img
                  src={SECURITY_SLIDES[currentSlide].image}
                  alt={SECURITY_SLIDES[currentSlide].title}
                  className={styles.slideImage}
                />
              </div>
              <h3 className={styles.slideTitle}>{SECURITY_SLIDES[currentSlide].title}</h3>
              <p className={styles.slideDescription}>{SECURITY_SLIDES[currentSlide].description}</p>
            </div>

            <div className={styles.progressTrack}>
              <div
                key={currentSlide}
                className={styles.progressBar}
              />
            </div>

            <div className={styles.dotsContainer}>
              {SECURITY_SLIDES.map((_, index) => (
                <span
                  key={index}
                  className={`${styles.carouselDot} ${
                    index === currentSlide ? styles.carouselDotActive : ""
                  }`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>

            <div className={styles.systemStatus}>
              {/* <Loader /> */}
              <span>
                Verificando tu solicitud de forma segura, esto puede demorar algunos segundos...
              </span>
            </div>
          </div>
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
      <GenericInput
        label='Celular'
        name='celular'
        type='tel'
        inputMode='tel'
        value={formData.celular}
        onChange={handleChange}
        placeholder='Ej: 5491123456789'
        required
        error={errors.celular}
        autoComplete='tel'
      />
      <Turnstile
        ref={turnstileRef}
        siteKey={TURNSTILE_SITE_KEY}
        onVerify={setTurnstileToken}
        onExpire={handleExpire}
        onError={handleError}
      />
      {/* Honey Pot — campo oculto anti-spam */}
      <input
        type='text'
        name='email'
        tabIndex={-1}
        autoComplete='off'
        aria-hidden='true'
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        style={{
          position: "absolute",
          left: "-9999px",
          top: "auto",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      />
      <GenericButton
        type='submit'
        loading={isLoading}
        disabled={!isFormValid || !turnstileToken || isLoading}
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
