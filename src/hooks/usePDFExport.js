import { useCallback } from "react";

/**
 * Hook para exportar datos a PDF con formato COFA.
 *
 * @param {Object} options - Configuración del PDF
 * @param {string} options.title - Título del documento
 * @param {string} [options.logoUrl='/Logo.png'] - URL del logo
 * @param {Array<{label: string, value: any, type?: 'currency'|'date'|'percent'|'text'}>} options.fields - Campos a mostrar
 * @param {string} [options.primaryColor='#249557'] - Color primario (verde COFA)
 * @param {string} [options.footerText='Generado por COFA -'] - Texto del pie
 * @param {string} [options.filename='documento.pdf'] - Nombre del archivo
 */
export function usePDFExport(options) {
  const {
    title,
    logoUrl = "/Logo.png",
    fields = [],
    primaryColor = "#249557",
    footerText = "Generado por COFA -",
    filename = "documento.pdf",
  } = options;

  const generatePDF = useCallback(async () => {
    // Import dinámico — jspdf solo carga cuando el usuario hace clic en "Descargar PDF"
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginLeft = 15;
    const marginRight = 15;
    const labelWidth = 60;
    const valueX = marginLeft + labelWidth + 5;
    const maxValueWidth = pageWidth - marginRight - valueX;
    const lineHeight = 7;
    let yPosition = 40;

    // Cargar logo
    const logoImg = new Image();
    logoImg.src = logoUrl;
    await new Promise((resolve) => {
      logoImg.onload = resolve;
    });

    // Agregar logo
    pdf.addImage(logoImg, "PNG", 10, 10, 30, 12);

    // Título
    pdf.setFontSize(20);
    const colorHex = primaryColor.replace("#", "");
    const r = parseInt(colorHex.substring(0, 2), 16);
    const g = parseInt(colorHex.substring(2, 4), 16);
    const b = parseInt(colorHex.substring(4, 6), 16);
    pdf.setTextColor(r, g, b);
    pdf.text(title, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 25;

    // Calcular altura necesaria para el contenido
    let totalContentHeight = 0;
    fields.forEach((field) => {
      let displayValue = field.value;
      if (field.type === "currency") {
        displayValue = typeof field.value === "number"
          ? `$${field.value.toLocaleString("es-AR")}`
          : field.value;
      } else if (field.type === "percent") {
        displayValue = `${field.value}%`;
      }

      if (field.label) {
        // Label + Value
        const valueText = String(displayValue);
        const labelLines = pdf.splitTextToSize(`${field.label}:`, labelWidth);
        const valueLines = pdf.splitTextToSize(valueText, maxValueWidth);
        totalContentHeight += Math.max(labelLines.length, valueLines.length) * lineHeight;
      } else {
        // Solo value (texto sin label, para mensajes especiales)
        const valueLines = pdf.splitTextToSize(String(displayValue), pageWidth - marginLeft - marginRight);
        totalContentHeight += valueLines.length * lineHeight;
      }
    });

    // Fondo para sección
    const sectionPadding = 15;
    const sectionHeight = totalContentHeight + sectionPadding * 2;
    pdf.setFillColor(240, 240, 240);
    pdf.rect(10, yPosition - 10, pageWidth - 20, sectionHeight, "F");
    yPosition += 5;

    // Información
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);

    fields.forEach((field) => {
      let displayValue = field.value;
      if (field.type === "currency") {
        displayValue = typeof field.value === "number"
          ? `$${field.value.toLocaleString("es-AR")}`
          : field.value;
      } else if (field.type === "percent") {
        displayValue = `${field.value}%`;
      }

      if (field.label) {
        pdf.setFont("helvetica", "bold");
        const labelLines = pdf.splitTextToSize(`${field.label}:`, labelWidth);
        pdf.text(labelLines, marginLeft, yPosition);
        pdf.setFont("helvetica", "normal");
        const valueLines = pdf.splitTextToSize(String(displayValue), maxValueWidth);
        pdf.text(valueLines, valueX, yPosition);
        yPosition += Math.max(labelLines.length, valueLines.length) * lineHeight;
      } else {
        // Texto sin label (mensaje especial)
        pdf.setFont("helvetica", "italic");
        const valueLines = pdf.splitTextToSize(String(displayValue), pageWidth - marginLeft - marginRight);
        pdf.text(valueLines, marginLeft, yPosition);
        yPosition += valueLines.length * lineHeight;
      }
    });

    // Pie de página
    yPosition += 15;
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    const textWidth = pdf.getTextWidth(footerText);
    const textX = pageWidth / 2 - textWidth / 2;
    pdf.text(footerText, textX, pageHeight - 20);
    pdf.addImage(logoImg, "PNG", textX + textWidth + 5, pageHeight - 27, 20, 8);

    pdf.save(filename);
  }, [title, logoUrl, fields, primaryColor, footerText, filename]);

  return { generatePDF };
}