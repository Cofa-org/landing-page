import React from "react";
import PropTypes from "prop-types";
import styles from "./HeroLoanSim.module.css";
import { IoIosCheckmarkCircleOutline } from "react-icons/io";

/**
 * Hero component specifically designed for the Loan Simulator screen.
 * Follows the project's premium aesthetic and responsive guidelines.
 */
const HeroLoanSim = ({
  title = "Tu Préstamo,",
  highlightedTitle = "a tu Medida",
  description = "Simulá tu préstamo 100% digital y obtené una respuesta en minutos. Sin vueltas, con la transparencia que buscás.",
  trustItems = ["Mínimos Requisitos", "100% Digital", "En el día", "Seguro y Confiable"],
}) => {
  return (
    <section className={styles.heroContainer}>
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

      <div className={styles.heroImageContainer}>
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
        />
      </div>
    </section>
  );
};

HeroLoanSim.propTypes = {
  title: PropTypes.string,
  highlightedTitle: PropTypes.string,
  description: PropTypes.string,
  trustItems: PropTypes.arrayOf(PropTypes.string),
};

export default HeroLoanSim;
