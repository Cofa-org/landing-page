import React, { memo } from "react";
import PropTypes from "prop-types";
import {
  MdInfoOutline,
  MdAttachMoney,
  MdCalendarToday,
  MdOutlinePayments,
  MdArrowForward,
} from "react-icons/md";
import styles from "../../LoanSimScreen.module.css";
import { useSimulationStep } from "../../hooks/useSimulationStep";
import { FraudWarning } from "../../../../Components/index.js";
import { roundToFiveHundreds } from "../../../../lib/utils.js";



const SimulationStep = ({
  amount,
  installment,
  simulationData,
  loading,
  nombreCompleto,
  onAmountChange,
  onInstallmentChange,
  onNextStep,
  error,
}) => {
  const {
    formatCurrency,
    installments,
    maxOffer,
    selectedPlan,
    cfta,
    cfto,
    tna,
    discountInstallment,
    discountInstRoundToFiveHund,
    installmentNbr,
    loanNbr,
    capitalWithoutDiscount,
    sortedInstallments,
    maxPlazo,
    secondMaxPlazo,
  } = useSimulationStep({ simulationData, installment });

  const [prevencionFraudes, setPrevencionFraudes] = React.useState(false);

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
          <label
            className={styles.label}
            htmlFor='amount-slider'
          >
            ¿Cuánto necesitás?
          </label>
          <span className={styles.amountValue}>{formatCurrency(amount)}</span>
        </div>
        <input
          id='amount-slider'
          type='range'
          aria-label='Cantidad de dinero a solicitar'
          min={discountInstallment ? discountInstRoundToFiveHund : "5000"}
          max={maxOffer}
          step='500'
          value={amount}
          onChange={(e) => onAmountChange(Number(e.target.value), discountInstRoundToFiveHund)}
          className={styles.slider}
        />
        <div className={styles.labelWrapper}>
          <span
            className={styles.label}
          >{`${discountInstallment ? formatCurrency(discountInstRoundToFiveHund) : "$ 5.000"}`}</span>
          <span className={styles.label}>{formatCurrency(maxOffer)}</span>
        </div>
      </div>
      {discountInstallment && installmentNbr && loanNbr && (
        <span className={styles.depositInfo}>
          <i>{`Se te depositaran ${formatCurrency(capitalWithoutDiscount)}.`}</i>
          <i>{`Se descontara la cuota pendiente Nro. ${installmentNbr} del préstamo Nro. ${loanNbr} por un monto de ${formatCurrency(discountInstallment)}`}</i>
        </span>
      )}
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

      <div style={{ marginTop: "24px" }}>
        <FraudWarning
          checked={prevencionFraudes}
          onChange={setPrevencionFraudes}
        />
      </div>

      <button
        className={styles["primary-btn"]}
        style={{ marginTop: "24px" }}
        onClick={() => onNextStep(prevencionFraudes)}
        disabled={!prevencionFraudes}
      >
        Solicitar préstamo con COFA
        <MdArrowForward color='#fff' />
      </button>

      <div
        style={{
          marginTop: "16px",
          textAlign: "center",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <svg
          stroke='currentColor'
          fill='currentColor'
          strokeWidth='0'
          viewBox='0 0 24 24'
          style={{ color: "#555" }}
          height='16'
          width='16'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            fill='none'
            d='M0 0h24v24H0z'
          ></path>
          <path d='M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z'></path>
        </svg>
        <span style={{ fontSize: "12px", color: "#555" }}>
          Tu información está protegida. Leé nuestros{" "}
          <a
            href='/terminos-y-condiciones'
            target='_blank'
            rel='noopener noreferrer'
            style={{ color: "#555", textDecoration: "underline" }}
          >
            Términos y Condiciones
          </a>{" "}
          y{" "}
          <a
            href='/politica-de-privacidad'
            target='_blank'
            rel='noopener noreferrer'
            style={{ color: "#555", textDecoration: "underline" }}
          >
            Política de Privacidad
          </a>
          .
        </span>
      </div>

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
  simulationData: PropTypes.object,
  loading: PropTypes.bool,
  nombreCompleto: PropTypes.string,
  onAmountChange: PropTypes.func.isRequired,
  onInstallmentChange: PropTypes.func.isRequired,
  onNextStep: PropTypes.func.isRequired,
};

export default memo(SimulationStep);
