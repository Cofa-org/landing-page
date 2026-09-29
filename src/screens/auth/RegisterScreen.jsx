import { useCallback, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header, Footer } from "../../Components/index.js";
import GenericForm from "../../Components/Forms/GenericForm/GenericForm.jsx";
import GenericInput from "../../Components/Forms/GenericInput/GenericInput.jsx";
import PasswordInput from "../../Components/Forms/GenericInput/PasswordInput.jsx";
import GenericButton from "../../Components/buttons/GenericButton/GenericButton.jsx";
import Turnstile from "../../Components/Turnstile/Turnstile.jsx";
import OTPValidation from "../../Components/OTPValidation/OTPValidation.jsx";
import authService from "../../services/authService.js";
import { TURNSTILE_SITE_KEY } from "../../config.js";
import styles from "./auth.module.css";

/**
 * Pasos del registro.
 * DNI         — el usuario ingresa su DNI
 * IDENTITY    — selección de CUIT cuando el padrón devuelve múltiples identidades
 * REGISTER    — nuevo usuario: ingresa email + contraseña
 * EXISTING    — cliente existente: el sistema ya tiene su email; ingresa solo contraseña
 * VERIFY      — verificación OTP del email
 */
const STEP = {
  DNI: "dni",
  IDENTITY: "identity",
  REGISTER: "register",
  EXISTING: "existing",
  VERIFY: "verify",
};

/* ── Panel izquierdo compartido ──────────────────────────────────── */
const LeftPanel = ({ title, sub }) => (
  <div className={styles.leftPanel}>
    <img src="/Logo.svg" alt="COFA" className={styles.leftPanelLogo} />
    <p className={styles.leftPanelTitle}>{title}</p>
    <p className={styles.leftPanelSub}>{sub}</p>
    <img
      src="/img/welcome_success_celebration.webp"
      alt=""
      className={styles.leftPanelImage}
      loading="lazy"
    />
  </div>
);

const RegisterScreen = () => {
  const navigate = useNavigate();

  /* ── Estado compartido entre pasos ── */
  const [step, setStep] = useState(STEP.DNI);

  // Datos resueltos en cada paso
  const [dni, setDni] = useState("");
  const [identities, setIdentities] = useState([]); // [{ cuit, nombreCompleto }]
  const [selectedCuit, setSelectedCuit] = useState(null);

  // Para clientes existentes: email determinado por el sistema (NO ingresado por el usuario)
  const [existingMaskedEmail, setExistingMaskedEmail] = useState("");
  const [existingFullEmail, setExistingFullEmail] = useState(""); // solo para el paso OTP

  // Para nuevos usuarios: email + contraseña ingresados por el usuario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Honeypot anti-bot
  const [honeypot, setHoneypot] = useState("");

  /* ── Paso DNI ── */
  const [turnstileDni, setTurnstileDni] = useState("");
  const turnstileDniRef = useRef(null);
  const [loadingDni, setLoadingDni] = useState(false);
  const [errorDni, setErrorDni] = useState("");

  /* ── Paso REGISTER (nuevo usuario) ── */
  const [turnstileReg, setTurnstileReg] = useState("");
  const turnstileRegRef = useRef(null);
  const [loadingReg, setLoadingReg] = useState(false);
  const [errorReg, setErrorReg] = useState("");

  /* ── Paso EXISTING (cliente existente) ── */
  const [passwordExisting, setPasswordExisting] = useState("");
  const [turnstileExisting, setTurnstileExisting] = useState("");
  const turnstileExistingRef = useRef(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [errorExisting, setErrorExisting] = useState("");

  /* ── Paso VERIFY (OTP) ── */
  const [turnstileVerify, setTurnstileVerify] = useState("");
  const turnstileVerifyRef = useRef(null);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [errorVerify, setErrorVerify] = useState("");

  // Callbacks estables para Turnstile
  const onVerifyDni = useCallback((t) => setTurnstileDni(t), []);
  const onClearDni = useCallback(() => setTurnstileDni(""), []);
  const onVerifyReg = useCallback((t) => setTurnstileReg(t), []);
  const onClearReg = useCallback(() => setTurnstileReg(""), []);
  const onVerifyExisting = useCallback((t) => setTurnstileExisting(t), []);
  const onClearExisting = useCallback(() => setTurnstileExisting(""), []);
  const onVerifyVerify = useCallback((t) => setTurnstileVerify(t), []);
  const onClearVerify = useCallback(() => setTurnstileVerify(""), []);

  /* ── Paso 1: resolver DNI ── */
  const handleDniSubmit = async () => {
    if (honeypot) return;
    if (!turnstileDni) {
      setErrorDni("Completá la verificación de seguridad.");
      return;
    }
    setErrorDni("");
    setLoadingDni(true);
    try {
      const result = await authService.resolveDni(dni.trim(), turnstileDni);

      if (result.identities.length > 1) {
        // Múltiples CUITs → el usuario elige
        setIdentities(result.identities);
        if (result.existingClient) {
          setExistingMaskedEmail(result.existingClient.maskedEmail);
        }
        setStep(STEP.IDENTITY);
      } else if (result.identities.length === 1) {
        const cuit = result.identities[0].cuit;
        setSelectedCuit(cuit);
        if (result.existingClient) {
          setExistingMaskedEmail(result.existingClient.maskedEmail);
          setStep(STEP.EXISTING);
        } else {
          setStep(STEP.REGISTER);
        }
      } else {
        // Sin identidades en padrón → igual puede registrarse (ingresa email manual)
        setStep(STEP.REGISTER);
      }
    } catch (err) {
      setErrorDni(err.message || "No pudimos verificar tu DNI. Intentá de nuevo.");
      turnstileDniRef.current?.reset();
      setTurnstileDni("");
    } finally {
      setLoadingDni(false);
    }
  };

  /* ── Paso 1b: selección de identidad ── */
  const handleIdentitySelect = (cuit) => {
    setSelectedCuit(cuit);
    // Si el cuit seleccionado coincide con el del cliente existente, ir a EXISTING
    if (existingMaskedEmail) {
      setStep(STEP.EXISTING);
    } else {
      setStep(STEP.REGISTER);
    }
  };

  /* ── Paso 2a: registro de nuevo usuario ── */
  const handleRegister = async () => {
    if (!turnstileReg) {
      setErrorReg("Completá la verificación de seguridad.");
      return;
    }
    setErrorReg("");
    setLoadingReg(true);
    try {
      await authService.register(email.trim(), password, turnstileReg, selectedCuit);
      setStep(STEP.VERIFY);
    } catch (err) {
      setErrorReg(err.message || "No pudimos crear la cuenta. Intentá de nuevo.");
      turnstileRegRef.current?.reset();
      setTurnstileReg("");
    } finally {
      setLoadingReg(false);
    }
  };

  /* ── Paso 2b: registro de cliente existente ── */
  const handleExistingClientRegister = async () => {
    if (!turnstileExisting) {
      setErrorExisting("Completá la verificación de seguridad.");
      return;
    }
    setErrorExisting("");
    setLoadingExisting(true);
    try {
      const result = await authService.registerExistingClient(
        selectedCuit,
        passwordExisting,
        turnstileExisting,
      );
      // Guardamos el email completo (solo en memoria) para el paso OTP
      setExistingFullEmail(result.email);
      setStep(STEP.VERIFY);
    } catch (err) {
      setErrorExisting(err.message || "No pudimos crear la cuenta. Intentá de nuevo.");
      turnstileExistingRef.current?.reset();
      setTurnstileExisting("");
    } finally {
      setLoadingExisting(false);
    }
  };

  /* ── Paso 3: verificar email con OTP ── */
  // El email a verificar puede ser el ingresado (nuevo usuario) o el del sistema (existente)
  const emailParaVerificar = existingFullEmail || email.trim();

  const handleVerify = async (code) => {
    setErrorVerify("");
    setLoadingVerify(true);
    try {
      await authService.verifyEmail(emailParaVerificar, code, turnstileVerify);
      navigate("/ingresar", {
        replace: true,
        state: { successMessage: "¡Cuenta creada! Ya podés ingresar con tu contraseña." },
      });
    } catch (err) {
      setErrorVerify(err.message || "El código es inválido o expiró. Pedí uno nuevo.");
      turnstileVerifyRef.current?.reset();
      setTurnstileVerify("");
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleResend = async () => {
    try {
      await authService.resendOtp(emailParaVerificar, turnstileVerify);
    } catch {
      // Respuesta siempre genérica
    } finally {
      turnstileVerifyRef.current?.reset();
      setTurnstileVerify("");
    }
  };

  /* ═══════════════════════════════════════════════════
   * RENDERS por paso
   * ═════════════════════════════════════════════════ */

  /* ── PASO VERIFY ── */
  if (step === STEP.VERIFY) {
    return (
      <>
        <Header />
        <div className={styles.splitLayout}>
          <LeftPanel
            title="Verificá tu email"
            sub="Te enviamos un código de 6 dígitos. Ingresalo para activar tu cuenta."
          />
          <div className={styles.rightPanel}>
            <div style={{ width: "100%", maxWidth: "450px" }}>
              <OTPValidation
                destination={existingMaskedEmail || email.trim()}
                destinationType="email"
                onValidate={handleVerify}
                onResend={handleResend}
                onBack={() => setStep(existingFullEmail ? STEP.EXISTING : STEP.REGISTER)}
                loading={loadingVerify}
                error={errorVerify}
              />
              <div className={styles.turnstileWrapper} style={{ marginTop: "16px" }}>
                <Turnstile
                  ref={turnstileVerifyRef}
                  siteKey={TURNSTILE_SITE_KEY}
                  onVerify={onVerifyVerify}
                  onExpire={onClearVerify}
                  onError={onClearVerify}
                />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  /* ── PASO EXISTING (cliente con cuenta en sistema) ── */
  if (step === STEP.EXISTING) {
    return (
      <>
        <Header />
        <div className={styles.splitLayout}>
          <LeftPanel
            title="Bienvenido de vuelta"
            sub="Encontramos un registro vinculado a tu identidad. Elegí una contraseña para acceder."
          />
          <div className={styles.rightPanel}>
            <GenericForm title="Activá tu cuenta" onSubmit={handleExistingClientRegister}>
              <div className={styles.infoBox}>
                <p className={styles.infoBoxText}>
                  Te enviaremos un código de verificación a:{" "}
                  <strong>{existingMaskedEmail}</strong>
                </p>
              </div>

              <PasswordInput
                label="Elegí una contraseña"
                name="password"
                value={passwordExisting}
                onChange={(e) => setPasswordExisting(e.target.value)}
                autoComplete="new-password"
                required
                helperText="Mínimo 8 caracteres."
              />

              <div className={styles.turnstileWrapper}>
                <Turnstile
                  ref={turnstileExistingRef}
                  siteKey={TURNSTILE_SITE_KEY}
                  onVerify={onVerifyExisting}
                  onExpire={onClearExisting}
                  onError={onClearExisting}
                />
              </div>

              {errorExisting && (
                <p className={`${styles.alert} ${styles.alertError}`}>{errorExisting}</p>
              )}

              <div className={styles.formActions}>
                <GenericButton
                  type="submit"
                  loading={loadingExisting}
                  disabled={loadingExisting || !turnstileExisting || !passwordExisting}
                >
                  Activar cuenta
                </GenericButton>

                <button
                  type="button"
                  className={styles.backLink}
                  onClick={() =>
                    setStep(identities.length > 1 ? STEP.IDENTITY : STEP.DNI)
                  }
                >
                  ← Volver
                </button>
              </div>
            </GenericForm>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  /* ── PASO IDENTITY (selección de CUIT) ── */
  if (step === STEP.IDENTITY) {
    return (
      <>
        <Header />
        <div className={styles.splitLayout}>
          <LeftPanel
            title="Confirmá tu identidad"
            sub="Encontramos más de un registro para tu DNI. Seleccioná el que corresponde."
          />
          <div className={styles.rightPanel}>
            <div style={{ width: "100%", maxWidth: "450px" }}>
              <h2 className={styles.formTitle}>¿Cuál es tu CUIT?</h2>
              <p className={styles.formSubtitle}>
                Tu DNI tiene más de una identidad registrada en AFIP. Seleccioná la tuya.
              </p>
              <div className={styles.identityList}>
                {identities.map((identity) => (
                  <button
                    key={identity.cuit}
                    type="button"
                    className={styles.identityOption}
                    onClick={() => handleIdentitySelect(identity.cuit)}
                  >
                    <span className={styles.identityName}>
                      {identity.nombreCompleto ?? "Sin nombre registrado"}
                    </span>
                    <span className={styles.identityCuit}>CUIT {identity.cuit}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={styles.backLink}
                onClick={() => setStep(STEP.DNI)}
              >
                ← Volver a ingresar el DNI
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  /* ── PASO REGISTER (nuevo usuario: email + contraseña) ── */
  if (step === STEP.REGISTER) {
    return (
      <>
        <Header />
        <div className={styles.splitLayout}>
          <LeftPanel
            title="Empezá tu experiencia COFA"
            sub="Creá tu cuenta para ver el estado de tus solicitudes en cualquier momento."
          />
          <div className={styles.rightPanel}>
            <GenericForm title="Creá tu cuenta" onSubmit={handleRegister}>
              <GenericInput
                label="Email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoComplete="email"
              />

              <PasswordInput
                label="Contraseña"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                helperText="Mínimo 8 caracteres."
              />

              {/* Honeypot — campo oculto anti-bot */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ position: "absolute", left: "-9999px", top: "auto", width: "1px", height: "1px", overflow: "hidden", opacity: 0 }}
              />

              <div className={styles.turnstileWrapper}>
                <Turnstile
                  ref={turnstileRegRef}
                  siteKey={TURNSTILE_SITE_KEY}
                  onVerify={onVerifyReg}
                  onExpire={onClearReg}
                  onError={onClearReg}
                />
              </div>

              {errorReg && (
                <p className={`${styles.alert} ${styles.alertError}`}>{errorReg}</p>
              )}

              <div className={styles.formActions}>
                <GenericButton
                  type="submit"
                  loading={loadingReg}
                  disabled={loadingReg || !turnstileReg || !email.trim() || !password}
                >
                  Crear cuenta
                </GenericButton>

                <button
                  type="button"
                  className={styles.backLink}
                  onClick={() =>
                    setStep(identities.length > 1 ? STEP.IDENTITY : STEP.DNI)
                  }
                >
                  ← Volver
                </button>

                <p className={styles.auxLink}>
                  ¿Ya tenés cuenta?{" "}
                  <Link to="/ingresar">Ingresá</Link>
                </p>
              </div>
            </GenericForm>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  /* ── PASO DNI (punto de entrada) ── */
  return (
    <>
      <Header />
      <div className={styles.splitLayout}>
        <LeftPanel
          title="Empezá tu experiencia COFA"
          sub="Ingresá tu DNI para verificar tu identidad y crear tu cuenta."
        />
        <div className={styles.rightPanel}>
          <GenericForm title="Verificá tu identidad" onSubmit={handleDniSubmit}>
            <GenericInput
              label="DNI"
              name="dni"
              type="text"
              inputMode="numeric"
              value={dni}
              onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
              placeholder="Ej: 30123456"
              required
              autoComplete="off"
              maxLength={8}
              helperText="Sin puntos ni guiones."
            />

            {/* Honeypot — campo oculto anti-bot */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              style={{ position: "absolute", left: "-9999px", top: "auto", width: "1px", height: "1px", overflow: "hidden", opacity: 0 }}
            />

            <div className={styles.turnstileWrapper}>
              <Turnstile
                ref={turnstileDniRef}
                siteKey={TURNSTILE_SITE_KEY}
                onVerify={onVerifyDni}
                onExpire={onClearDni}
                onError={onClearDni}
              />
            </div>

            {errorDni && (
              <p className={`${styles.alert} ${styles.alertError}`}>{errorDni}</p>
            )}

            <div className={styles.formActions}>
              <GenericButton
                type="submit"
                loading={loadingDni}
                disabled={loadingDni || !turnstileDni || dni.trim().length < 7}
              >
                Continuar
              </GenericButton>

              <p className={styles.auxLink}>
                ¿Ya tenés cuenta?{" "}
                <Link to="/ingresar">Ingresá</Link>
              </p>
            </div>
          </GenericForm>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default RegisterScreen;
