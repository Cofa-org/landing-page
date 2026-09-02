import React, { memo, useRef, useState } from "react";
import PropTypes from "prop-types";
import GenericForm from "../../../../Components/Forms/GenericForm/GenericForm.jsx";
import GenericInput from "../../../../Components/Forms/GenericInput/GenericInput.jsx";
import GenericSelect from "../../../../Components/Forms/GenericInput/GenericSelect.jsx";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import { SITUACION_LABORAL_OPTIONS } from "../../../../constants/LOAN_SIM.js";
import { useLeadRegistration, SECURITY_SLIDES } from "../../hooks/useLeadRegistration.js";
import Turnstile from "../../../../Components/Turnstile/Turnstile.jsx";
import { TURNSTILE_SITE_KEY } from "../../../../config.js";
import FraudWarning from "../FraudWarning/FraudWarning.jsx";
import CanalesOficialesWarning from "../FraudWarning/CanalesOficialesWarning.jsx";
import styles from "./LeadRegistrationStep.module.css";

const LeadRegistrationStep = ({ onSuccess, onRejected, onAnalysis, onNext, loading, error: externalError }) => {
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
    handleTerminosChange,
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
      // No llamar onNext() cuando el back pide selección de identidad:
      // handleLeadSuccess ya navega a LOAN_SIM_STEPS.IDENTITY_SELECTION
      // (en useOnboardingFlow) y onNext() sobreescribiría a PHONE_VALIDATION.
      if (onNext && !result.data?.requiresIdentitySelection) {
        onNext();
      }
      return;
    }

    turnstileRef.current?.reset();
    setTurnstileToken("");
    if (result.analysis && onAnalysis) {
      onAnalysis(result.data);
      return;
    }
    if (result.rejected && onRejected) {
      onRejected();
    }
  };

  const isLoading = loading || isSubmitting;

  const showFechaNacimiento = Number(formData.dni) >= 90000000;

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
      
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
        <FraudWarning checked={false} onChange={() => {}} showCheckbox={false} />
        <CanalesOficialesWarning />
      </div>

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
      {showFechaNacimiento && (
        <GenericInput
          label='Fecha de nacimiento'
          name='fechaNacimiento'
          type='date'
          value={formData.fechaNacimiento}
          onChange={handleChange}
          required
          error={errors.fechaNacimiento}
        />
      )}
      <GenericInput
        label='Celular'
        name='celular'
        type='tel'
        inputMode='tel'
        value={formData.celular}
        onChange={handleChange}
        placeholder='Ej: 1145678901'
        helperText='Ingresa tu número sin +549 ni 0 (1145678901). Total: 10 dígitos.'
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
      <GenericSelect
        label='Situación laboral'
        name='situacionLaboral'
        value={formData.situacionLaboral}
        onChange={handleChange}
        options={SITUACION_LABORAL_OPTIONS}
        required
        error={errors.situacionLaboral}
      />
      <div className={styles.terminosContainer}>
        <label className={styles.terminosLabel}>
          <input
            type='checkbox'
            name='term_y_cond'
            checked={formData.term_y_cond}
            onChange={handleTerminosChange}
            required
            aria-required='true'
            aria-label='Aceptar términos y condiciones'
          />
          <span>
            Acepto los <a href='/terminos-y-condiciones' target='_blank' rel='noopener noreferrer'>términos y condiciones</a>
          </span>
        </label>
        <label className={styles.terminosLabel}>
          <input
            type='checkbox'
            name='prevencion_fraudes'
            checked={formData.prevencion_fraudes}
            onChange={handleTerminosChange}
            required
            aria-required='true'
            aria-label='Aceptar prevención de fraudes'
          />
          <span>
            Entiendo esta advertencia, declaro que soy el beneficiario final del préstamo solicitado y que la solicitud la estoy realizando para mi propio beneficio.
          </span>
        </label>
      </div>
      <GenericButton
        type='submit'
        loading={isLoading}
        disabled={!isFormValid || !turnstileToken || isLoading}
      >
        Continuar con mi solicitud en COFA
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
  onSuccess: PropTypes.func.isRequired,
  onRejected: PropTypes.func.isRequired,
  onAnalysis: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
};

LeadRegistrationStep.displayName = "LeadRegistrationStep";

export default memo(LeadRegistrationStep);
