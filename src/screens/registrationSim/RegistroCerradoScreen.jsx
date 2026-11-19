import { memo } from "react";
import GenericButton from "../../Components/buttons/GenericButton/GenericButton.jsx";
import { Footer, Header } from "../../Components/index.js";
import { HeroLoanSim } from "../../Sections/index.js";
import { openCallbellWebchat } from "../../utils/callbellHelpers";
import styles from "./OnboardingFlow.module.css";

// El registro web está cerrado: esta pantalla reemplaza al onboarding sin montar
// su lógica, para no restaurar sesiones ni consumir links `?id=` de operador.
const RegistroCerradoScreen = () => (
  <>
    <Header />
    <main id='main-content'>
      <div className={styles.splitLayout}>
        <div className={styles.leftColumn}>
          <HeroLoanSim />
        </div>
        <div className={`${styles.homeCalculator_calculatorBox} ${styles.rightColumn}`}>
          <div className={styles.calculatorContainer}>
            <div className={styles.restoreError}>
              <div>
                <h2>Pedí tu préstamo por el chat</h2>
                <p>Escribinos y un asesor te va a ayudar con tu solicitud.</p>
              </div>
              <GenericButton onClick={() => openCallbellWebchat()}>Hablar con un asesor</GenericButton>
            </div>
          </div>
        </div>
      </div>
    </main>
    <Footer />
  </>
);

export default memo(RegistroCerradoScreen);
