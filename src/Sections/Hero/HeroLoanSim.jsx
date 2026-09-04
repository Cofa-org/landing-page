import React from "react";
import PropTypes from "prop-types";
import styles from "./HeroLoanSim.module.css";
import { IoIosCheckmarkCircleOutline } from "react-icons/io";
import { CanalesOficialesWarning } from ".././../Components/index.js";

/**
 * Hero component specifically designed for the Loan Simulator screen.
 * Follows the project's premium aesthetic and responsive guidelines.
 */
const HeroLoanSim = ({
  title = "Tu Préstamo,",
  highlightedTitle = "a tu Medida",
  description = "Simulá tu préstamo 100% digital y obtené una respuesta en minutos. Sin vueltas, con la transparencia que buscás.",
  trustItems = ["Mínimos Requisitos", "100% Digital", "En el día", "Seguro y Confiable"],
  showCanalesOficiales = false,
}) => {
  const containerStyle = showCanalesOficiales
    ? { height: "100%", justifyContent: "space-between" }
    : {};

  const imageContainerStyle = showCanalesOficiales
    ? {
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        alignItems: "center",
        flexGrow: 1,
        marginTop: "16px",
      }
    : { display: "flex", flexDirection: "column", gap: "24px", alignItems: "center" };

  const imageStyle = showCanalesOficiales
    ? { marginTop: "auto", marginBottom: "auto", maxHeight: "250px", transform: "scale(1.4)" }
    : {};

  return (
    <section
      className={styles.heroContainer}
      style={containerStyle}
    >
      <div className={styles.heroContent}>
        <h1>
          {title} <br />
          <span className={styles.primaryText}>{highlightedTitle}</span>
        </h1>
        <p>{description}</p>

        <div className={styles.trustElements}>
          {trustItems?.map((item, index) => (
            <div
              key={index}
              className={styles.trustItem}
            >
              <IoIosCheckmarkCircleOutline className={styles.trustIcon} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className={styles.heroImageContainer}
        style={imageContainerStyle}
      >
        <img
          src='/img/hero-loan-sim-esp-600.webp'
          srcSet='/img/hero-loan-sim-esp-300.webp 300w, /img/hero-loan-sim-esp-600.webp 600w'
          sizes='(max-width: 576px) 300px, (max-width: 992px) 600px, 600px'
          alt='Simulador de Préstamos COFA'
          className={styles.heroImage}
          width={600}
          height={600}
          loading='eager'
          fetchPriority='high'
          style={imageStyle}
        />

        {showCanalesOficiales && (
          <div style={{ width: "100%", maxWidth: "420px" }}>
            <CanalesOficialesWarning
              footerText='Ante cualquier duda o inconveniente, comunicate siempre por nuestros canales oficiales.'
              horizontal={true}
            />
          </div>
        )}
      </div>
    </section>
  );
};

HeroLoanSim.propTypes = {
  title: PropTypes.string,
  highlightedTitle: PropTypes.string,
  description: PropTypes.string,
  trustItems: PropTypes.arrayOf(PropTypes.string),
  showCanalesOficiales: PropTypes.bool,
};

export default HeroLoanSim;
