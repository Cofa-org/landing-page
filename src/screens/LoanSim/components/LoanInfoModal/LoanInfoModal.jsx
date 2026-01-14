import React from "react";
import { jsPDF } from "jspdf";
import styles from "./LoanInfoModal.module.css";

const LoanInfoModal = ({ loanInfo, closeModal }) => {
  const generatePDF = async () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 40;

    // Cargar logo
    const logoImg = new Image();
    logoImg.src = "/Logo.png"; // Convierte Logo.svg a Logo.png y colócalo en public/
    await new Promise((resolve) => {
      logoImg.onload = resolve;
    });

    // Agregar logo
    pdf.addImage(logoImg, "PNG", 10, 10, 30, 12);

    // Título
    pdf.setFontSize(20);
    pdf.setTextColor(36, 149, 87); // Verde COFA
    pdf.text("Información del Préstamo", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 30;

    // Fondo para sección
    pdf.setFillColor(240, 240, 240);
    pdf.rect(10, yPosition - 10, pageWidth - 20, 120, "F");
    yPosition += 10;

    // Información
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    const info = [
      `Fecha de solicitud: ${loanInfo.FechaDeSolicitud}`,
      `Capital del préstamo: ${loanInfo.CapitalDelPrestamo}`,
      `Total de intereses: ${loanInfo.TotalDeIntereses}`,
      `Cantidad de cuotas: ${loanInfo.CantidadDeCuotas}`,
      `Monto cuota: ${loanInfo.MontoCuota}`,
      `CFTO: ${loanInfo.CFTO}`,
      `TNA: ${loanInfo.TNA}`,
      `CFTA: ${loanInfo.CFTA}`,
    ];

    info.forEach((item) => {
      const colonIndex = item.indexOf(":");
      const label = item.substring(0, colonIndex + 1);
      const value = item.substring(colonIndex + 1).trim();
      pdf.setFont("helvetica", "bold");
      pdf.text(label, 20, yPosition);
      pdf.setFont("helvetica", "normal");
      pdf.text(value, 100, yPosition);
      yPosition += 10;
    });

    // Pie de página
    yPosition += 20;
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    const footerText = "Generado por COFA -";
    const textWidth = pdf.getTextWidth(footerText);
    const textX = pageWidth / 2 - textWidth / 2;
    pdf.text(footerText, textX, pageHeight - 20);
    // Agregar logo pequeño al lado
    pdf.addImage(logoImg, "PNG", textX + textWidth + 5, pageHeight - 27, 20, 8);

    pdf.save("informacion-prestamo.pdf");
  };

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
