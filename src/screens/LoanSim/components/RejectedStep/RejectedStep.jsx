import React, { memo } from "react";
import { MdWarning } from "react-icons/md";
import { REJECTION_CONFIG } from "../../../../constants/LOAN_SIM.js";
import styles from "../../LoanSimScreen.module.css";

const RejectedStep = ({ rejection = REJECTION_CONFIG.DEVICE_MISMATCH }) => {
  const { title, description, illustration, primaryAction } = rejection;

  return (
    <div className={styles.calculatorMainBox}>
      <div className={styles.calculatorContainer}>
        <div style={{ textAlign: "center", padding: "32px 16px" }}>
          {illustration ? (
            <img
              src={illustration}
              alt=""
              style={{ maxWidth: "240px", marginBottom: "16px" }}
            />
          ) : (
            <MdWarning size={64} color="#d32f2f" style={{ marginBottom: "16px" }} />
          )}
          <h2 className={styles.title}>{title}</h2>
          <p
            style={{
              fontSize: "16px",
              lineHeight: 1.5,
              margin: "16px 0",
              color: "#555",
            }}
          >
            {description}
          </p>
          {primaryAction && (
            <a
              href={primaryAction.href}
              target={primaryAction.target}
              rel={primaryAction.target === "_blank" ? "noopener noreferrer" : undefined}
              className="primary-btn"
              style={{ textAlign: "center", display: "inline-block", marginTop: "16px" }}
            >
              {primaryAction.label}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(RejectedStep);
