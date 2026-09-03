import React from "react";
import { FaWhatsapp } from "react-icons/fa";
import { MdOutlineMail } from "react-icons/md";
import styles from "./FraudWarning.module.css";

const CanalesOficialesWarning = () => {
  return (
    <div className={styles.warningContainer} style={{ backgroundColor: "#f6faf6", borderColor: "#a3cfa4", marginTop: 0, marginBottom: 0 }}>
      <div className={styles.warningHeader} style={{ marginBottom: "8px" }}>
        <span className={styles.warningTitle} style={{ color: "#1a6a3d" }}>Canales oficiales de COFA</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FaWhatsapp style={{ color: "#1a6a3d", fill: "#1a6a3d" }} size={18} />
          <span style={{ fontSize: "14px", color: "#333" }}><strong>WhatsApp:</strong> 11-3753-0853</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <MdOutlineMail style={{ color: "#1a6a3d", fill: "#1a6a3d" }} size={18} />
          <span style={{ fontSize: "14px", color: "#333" }}><strong>Email:</strong> consultas@cofa.com.ar</span>
        </div>
      </div>
    </div>
  );
};

export default CanalesOficialesWarning;
