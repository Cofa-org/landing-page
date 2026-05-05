import React from "react";
import PropTypes from "prop-types";
import {
  MdInfoOutline,
  MdAttachMoney,
  MdCalendarToday,
  MdOutlinePayments,
  MdArrowForward,
} from "react-icons/md";
import styles from "../../LoanSimScreen.module.css";

const SimulationStep = ({
  amount,
  installment,
  maxOffer,
  installments,
  simulationData,
  selectedPlan,
  loading,
  nombreCompleto,
  onAmountChange,
  onInstallmentChange,
  onNextStep,
  error,
}) => {
  const formatCurrency = (value) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(value || 0);

  const cfta = (simulationData?.tasa_nominal * 100).toFixed(2) || 0;
  const cfto = (selectedPlan?.tasaOp * 100).toFixed(2) || 0;
  const tna = (cfta * 0.79).toFixed(2);

  // Installment nudge logic
  const sortedInstallments = [...installments].sort((a, b) => a - b);
  const maxPlazo = Math.max(...installments);
  const secondMaxPlazo =
    sortedInstallments.length > 1 ? sortedInstallments[sortedInstallments.length - 2] : maxPlazo;

  return (
    <div className={styles.calculatorMainBox}>
      <h2 className={styles.title}>
        <MdAttachMoney className={styles.headerIcon} />
        Simulá tu préstamo
      </h2>
      {nombreCompleto && <p className={styles.cuitDisplay}>{nombreCompleto}</p>}

      {/* Amount Slider */}
      <div className={styles.inputGroup}>
        <div className={styles.labelWrapper}>
          <label className={styles.label}>¿Cuánto necesitás?</label>
          <span className={styles.amountValue}>{formatCurrency(amount)}</span>
        </div>
        <input
          type='range'
          min='5000'
          max={maxOffer}
          step='500'
          value={amount}
          onChange={(e) => onAmountChange(Number(e.target.value))}
          className={styles.slider}
        />
        <div className={styles.labelWrapper}>
          <span className={styles.label}>$ 5.000</span>
          <span className={styles.label}>{formatCurrency(maxOffer)}</span>
        </div>
      </div>

      {/* Installments Selector */}
      <div className={styles.inputGroup}>
        <label className={styles.label}>
          <MdCalendarToday className={styles.headerIcon} />
          Elegí tu plan de cuotas
        </label>
        <div className={styles.installmentGrid}>
          {sortedInstallments.map((plazo) => {
            // const isRecommended = plazo === maxPlazo;
            // const isPopular = plazo === secondMaxPlazo && sortedInstallments.length > 2;

            let badgeText = "";
            // if (isRecommended) badgeText = "CUOTA MÍNIMA";
            // else if (isPopular) badgeText = "RECOMENDADO";

            return (
              <button
                key={plazo}
                type='button'
                className={`${styles.installmentBtn} ${
                  installment === plazo ? styles.installmentBtnActive : ""
                }`}
                onClick={() => onInstallmentChange(plazo)}
              >
                {badgeText && (
                  <span
                    className={`${styles.installmentBadge} ${!isRecommended ? styles.installmentBadgeSecondary : ""}`}
                  >
                    {badgeText}
                  </span>
                )}
                {plazo === 1 ? `${plazo} cuota` : `${plazo} cuotas`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Section */}
      <div className={styles.resultsBox}>
        <div className={styles.resultItem}>
          <span className={styles.resultLabel}>
            <MdOutlinePayments style={{ marginRight: "8px", verticalAlign: "middle" }} />
            Tu cuota mensual
          </span>
          <span className={`${styles.resultValue} ${styles.resultValueLarge}`}>
            {formatCurrency(selectedPlan?.valorCuota)}
          </span>
        </div>
      </div>

      <button
        className={styles["primary-btn"]}
        style={{ marginTop: "48px" }}
        onClick={onNextStep}
      >
        ¡Pedilo ahora!
        <MdArrowForward
          color='#fff'
        />
      </button>

      <div className={styles.footerRow}>
        <div className={styles.infoContainer}>
          <MdInfoOutline className={styles.infoIcon} />
          <div className={styles.tooltip}>
            <p>CFTA: {cfta}%</p>
            <p>CFTO: {cfto}%</p>
            <p>TNA: {tna}%</p>
          </div>
        </div>
      </div>
      {error && <p className={styles.error}>{`⚠️ ${error}`}</p>}
    </div>
  );
};

SimulationStep.propTypes = {
  amount: PropTypes.number.isRequired,
  installment: PropTypes.number,
  maxOffer: PropTypes.number.isRequired,
  installments: PropTypes.arrayOf(PropTypes.number).isRequired,
  simulationData: PropTypes.object,
  selectedPlan: PropTypes.object,
  loading: PropTypes.bool,
  cuit: PropTypes.string,
  onAmountChange: PropTypes.func.isRequired,
  onInstallmentChange: PropTypes.func.isRequired,
  onNextStep: PropTypes.func.isRequired,
};

export default SimulationStep;
