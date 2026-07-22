import React, { memo, useEffect, useState } from "react";
import PropTypes from "prop-types";
import GenericButton from "../../../../Components/buttons/GenericButton/GenericButton.jsx";
import { SECURITY_SLIDES } from "../../hooks/useLeadRegistration.js";
import styles from "./IdentitySelectionStep.module.css";

const formatCuit = (cuit) => {
  const s = String(cuit);
  if (s.length !== 11) return s;
  return `${s.slice(0, 2)}-${s.slice(2, 10)}-${s.slice(10)}`;
};

const IdentitySelectionStep = ({ identities, onSelect, loading, error }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const isSubmitting = Boolean(loading);

  // Carousel animation controlled by isSubmitting
  useEffect(() => {
    if (!isSubmitting) {
      setCurrentSlide(0);
      return;
    }
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SECURITY_SLIDES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isSubmitting]);

  const handleClick = async (cuit) => {
    if (isSubmitting) return;
    await onSelect(String(cuit));
  };

  return (
    <div className={styles.formTemplateContainer}>
      <div className={styles.formTemplate}>
        {isSubmitting ? (
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
                <span>
                  Procesando tu selección de identidad de forma segura, esto puede demorar algunos segundos...
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <h2 className={styles.title}>Encontramos más de una persona con tu DNI</h2>
            <p className={styles.subtitle}>
              Elegí la persona correcta para continuar con tu solicitud.
            </p>
            <div className={styles.cardsList}>
              {identities.map((identity) => (
                <GenericButton
                  key={identity.cuit}
                  type="button"
                  variant="outline"
                  className={styles.card}
                  onClick={() => handleClick(identity.cuit)}
                  disabled={isSubmitting}
                >
                  <div>{identity.nombreCompleto}</div>
                  <div className={styles.cardCuit}>CUIT {formatCuit(identity.cuit)}</div>
                </GenericButton>
              ))}
            </div>
            {error && <p className={styles.error}>{error} 😊</p>}
          </>
        )}
      </div>
    </div>
  );
};

IdentitySelectionStep.propTypes = {
  identities: PropTypes.arrayOf(
    PropTypes.shape({
      cuit: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      nombreCompleto: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  // `onBack` sigue aceptándose en la firma porque el screen padre lo pasa,
  // pero la navegación back se resuelve a nivel de pantalla vía BackButton.
  onBack: PropTypes.func,
};

IdentitySelectionStep.defaultProps = {
  loading: false,
  error: null,
  onBack: undefined,
};

export default memo(IdentitySelectionStep);
