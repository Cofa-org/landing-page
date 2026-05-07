import React from "react";
import { usePDFExport } from "../../../../hooks/usePDFExport";
import styles from "./LoanInfoModal.module.css";

const LoanInfoModal = ({ loanInfo, closeModal, simulationData }) => {
  const usedCapital = simulationData?.capital_utilizado;
  const discountInstallment = simulationData?.cuotaADescontar;
  const installmentNbr = simulationData?.nroCuota;
  const loanNbr = simulationData?.nroPrestamo;

  const fields = [
    { label: "Fecha de solicitud", value: loanInfo.FechaDeSolicitud, type: "text" },
    { label: "Capital del préstamo", value: loanInfo.CapitalDelPrestamo, type: "currency" },
    ...(discountInstallment && installmentNbr && loanNbr
      ? [{
          label: "",
          value: `Se te depositaran $${usedCapital - discountInstallment}. Se descontara la cuota pendiente Nro. ${installmentNbr} del préstamo Nro. ${loanNbr} por un monto de $${discountInstallment}`,
          type: "text",
        }]
      : []),
    { label: "Total de intereses", value: loanInfo.TotalDeIntereses, type: "currency" },
    { label: "Cantidad de cuotas", value: loanInfo.CantidadDeCuotas, type: "text" },
    { label: "Monto cuota", value: loanInfo.MontoCuota, type: "currency" },
    { label: "CFTO", value: loanInfo.CFTO, type: "percent" },
    { label: "TNA", value: loanInfo.TNA, type: "percent" },
    { label: "CFTA", value: loanInfo.CFTA, type: "percent" },
  ];

  const { generatePDF } = usePDFExport({
    title: "Información del Préstamo",
    filename: "informacion-prestamo.pdf",
    fields,
  });

  if (!loanInfo) return null;

  return (
    <div className={styles.modalContainer}>
      <div className={styles.modal}>
        <div className={styles.closeBtnContainer}>
          <button
            onClick={closeModal}
            className={styles.closeBtn}
          >
            ×
          </button>
        </div>

        <h1 className={styles.title}>Información del Préstamo</h1>
        <ul className={styles.infoList}>
          <li>
            <strong>Fecha de solicitud:</strong> {loanInfo.FechaDeSolicitud}
          </li>
          <li>
            <strong>Capital del préstamo:</strong> {loanInfo.CapitalDelPrestamo}
          </li>
          {discountInstallment && installmentNbr && loanNbr && (
            <li className={styles.loanmsg}>
              <i>{`Se te depositaran $${usedCapital - discountInstallment}.`}</i>
              <i>{`Se descontara la cuota pendiente Nro. ${installmentNbr} del préstamo Nro. ${loanNbr} por un monto de $${discountInstallment}`}</i>
            </li>
          )}
          <li>
            <strong>Total de intereses:</strong> {loanInfo.TotalDeIntereses}
          </li>
          <li>
            <strong>Cantidad de cuotas:</strong> {loanInfo.CantidadDeCuotas}
          </li>
          <li>
            <strong>Monto cuota:</strong> {loanInfo.MontoCuota}
          </li>
          <li>
            <strong>CFTO:</strong> {loanInfo.CFTO}
          </li>
          <li>
            <strong>TNA:</strong> {loanInfo.TNA}
          </li>
          <li>
            <strong>CFTA:</strong> {loanInfo.CFTA}
          </li>
        </ul>

        <button
          onClick={generatePDF}
          className={styles.downloadBtn}
        >
          Descargar PDF
        </button>
      </div>
    </div>
  );
};

export default LoanInfoModal;
