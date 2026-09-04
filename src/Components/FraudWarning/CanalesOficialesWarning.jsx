import React from "react";
import PropTypes from "prop-types";
import { FaWhatsapp } from "react-icons/fa";
import { MdOutlineMail } from "react-icons/md";
import styles from "./FraudWarning.module.css";

const CanalesOficialesWarning = ({ footerText, horizontal = false }) => {
  return (
    <div className={styles.warningContainer} style={{ backgroundColor: "var(--primary-color-10)", borderColor: "var(--primary-color-20)", marginTop: 0, marginBottom: 0 }}>
      <div className={styles.warningHeader} style={{ marginBottom: "8px" }}>
        <span className={styles.warningTitle} style={{ color: "var(--primary-color)" }}>Canales oficiales de COFA</span>
      </div>
      <div style={{ display: "flex", flexDirection: horizontal ? "row" : "column", gap: "8px", flexWrap: "wrap", justifyContent: horizontal ? "space-between" : "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FaWhatsapp style={{ color: "#1a6a3d", fill: "#1a6a3d" }} size={18} />
          <span style={{ fontSize: "14px", color: "#333" }}><strong>WhatsApp:</strong> 11-3753-0853</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <MdOutlineMail style={{ color: "#1a6a3d", fill: "#1a6a3d" }} size={18} />
          <span style={{ fontSize: "14px", color: "#333" }}><strong>Email:</strong> consultas@cofa.com.ar</span>
        </div>
      </div>
      {footerText && (
        <p style={{ fontSize: "13px", color: "#555", marginTop: "8px", marginBottom: 0, lineHeight: 1.4 }}>
          {footerText}
        </p>
      )}
    </div>
  );
};

CanalesOficialesWarning.propTypes = {
  footerText: PropTypes.string,
  horizontal: PropTypes.bool,
};

export default CanalesOficialesWarning;
