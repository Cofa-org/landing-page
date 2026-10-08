import styles from "./auth.module.css";

const AuthLeftPanel = ({ title, sub, image = "/img/welcome_success_celebration.webp" }) => (
  <div className={styles.leftPanel}>
    <img src="/Logo.svg" alt="COFA" className={styles.leftPanelLogo} />
    <p className={styles.leftPanelTitle}>{title}</p>
    <p className={styles.leftPanelSub}>{sub}</p>
    <img src={image} alt="" className={styles.leftPanelImage} loading="lazy" />
  </div>
);

export default AuthLeftPanel;
