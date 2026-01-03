import React from "react";
import { useLoanSimulator } from "../../hooks/useLoanSimulator";
import { MdInfoOutline } from "react-icons/md";
import styles from "./LoanSimScreen.module.css";

const LoanSimScreen = () => {
  const {
    amount,
    installment,
    simulationData,
    loading,
    error,
    cuit,
    handleAmountChange,
    handleInstallmentChange,
  } = useLoanSimulator();

  // Formatting helpers
  const formatCurrency = (value) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(value || 0);

  const maxOffer = simulationData?.capital_maximo_a_ofrecer
    ? Number(simulationData.capital_maximo_a_ofrecer)
    : 200000;
  const installments = simulationData?.plazos_disponibles || [];

  // Financial calculations
  const cfta = simulationData?.tasa_nominal || 0;
  const cfto = simulationData?.tasa_operacion || 0;
  const tna = (cfta * 0.79).toFixed(2); // CFTA - 21%

  if (error && !simulationData) {
    return (
      <div className={styles.homeCalculator_calculatorBox}>
        <div className={styles.calculatorContainer}>
          <h2 className={styles.title}>Simulador de Préstamo</h2>
          <div className={styles.errorContainer}>
            <p className={styles.errorMsg}>{error}</p>
            <p className={styles.errorSubtext}>
              Por favor, utilizá el enlace que recibiste para acceder al simulador.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.homeCalculator_calculatorBox}>
      <div className={`${styles.calculatorContainer} ${loading ? styles.loadingOverlay : ""}`}>
        <h2 className={styles.title}>Simulá tu préstamo</h2>
        {cuit && <p className={styles.cuitDisplay}>CUIT: {cuit}</p>}

        {/* Amount Slider */}
        <div className={styles.inputGroup}>
          <div className={styles.labelWrapper}>
            <label className={styles.label}>Importe a solicitar</label>
            <span className={styles.amountValue}>{formatCurrency(amount)}</span>
          </div>
          <input
            type='range'
            min='5000'
            max={maxOffer}
            step='500'
            value={amount}
            onChange={(e) => handleAmountChange(Number(e.target.value))}
            className={styles.slider}
          />
          <div className={styles.labelWrapper}>
            <span className={styles.label}>$ 5.000</span>
            <span className={styles.label}>{formatCurrency(maxOffer)}</span>
          </div>
        </div>

        {/* Installments Selector */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Cantidad de cuotas</label>
          <div className={styles.installmentGrid}>
            {installments.map((plazo) => (
              <button
                key={plazo}
                type='button'
                className={`${styles.installmentBtn} ${
                  installment === plazo ? styles.installmentBtnActive : ""
                }`}
                onClick={() => handleInstallmentChange(plazo)}
              >
                {plazo} cuotas
              </button>
            ))}
          </div>
        </div>

        {/* Results Section */}
        <div className={styles.resultsBox}>
          <div className={styles.resultItem}>
            <span className={styles.resultLabel}>Tu cuota mensual:</span>
            <span className={`${styles.resultValue} ${styles.resultValueLarge}`}>
              {formatCurrency(simulationData?.cuota)}
            </span>
          </div>
        </div>

        {loading && <div className={styles.spinner}>Recalculando...</div>}

        <button
          className='primary-btn'
          style={{ marginTop: "24px" }}
        >
          ¡Pedilo ahora!
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
      </div>
    </div>
  );
};

export default LoanSimScreen;
