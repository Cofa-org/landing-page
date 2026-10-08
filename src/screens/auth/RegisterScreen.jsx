import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import authService from "../../services/authService.js";
import { useTurnstile } from "./useTurnstile.js";
import { writeAuthFlash } from "./authFlash.js";
import RegisterDniStep from "./register/RegisterDniStep.jsx";
import RegisterIdentityStep from "./register/RegisterIdentityStep.jsx";
import RegisterNewStep from "./register/RegisterNewStep.jsx";
import RegisterExistingStep from "./register/RegisterExistingStep.jsx";
import RegisterAlreadyRegisteredStep from "./register/RegisterAlreadyRegisteredStep.jsx";
import RegisterVerifyStep from "./register/RegisterVerifyStep.jsx";

const STEP = {
  DNI: "dni",
  IDENTITY: "identity",
  REGISTER: "register",
  EXISTING: "existing",
  ALREADY_REGISTERED: "already_registered",
  VERIFY: "verify",
};

const nextStepFromExisting = (existingClient) => {
  if (!existingClient?.maskedEmail) return STEP.REGISTER;
  if (existingClient.alreadyRegistered && existingClient.verified) {
    return STEP.ALREADY_REGISTERED;
  }
  return STEP.EXISTING;
};

const RegisterScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState(STEP.DNI);
  const [dni, setDni] = useState("");
  const [identities, setIdentities] = useState([]);
  const [selectedCuit, setSelectedCuit] = useState(null);
  const [existingMaskedEmail, setExistingMaskedEmail] = useState("");
  const [existingFullEmail, setExistingFullEmail] = useState("");
  const [existingFromResolve, setExistingFromResolve] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [passwordExisting, setPasswordExisting] = useState("");

  const turnstileDni = useTurnstile();
  const turnstileReg = useTurnstile();
  const turnstileExisting = useTurnstile();
  const turnstileVerify = useTurnstile();

  const [loadingDni, setLoadingDni] = useState(false);
  const [errorDni, setErrorDni] = useState("");
  const [loadingReg, setLoadingReg] = useState(false);
  const [errorReg, setErrorReg] = useState("");
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [errorExisting, setErrorExisting] = useState("");
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [errorVerify, setErrorVerify] = useState("");

  const goBackIdentityOrDni = () =>
    setStep(identities.length > 1 ? STEP.IDENTITY : STEP.DNI);

  const handleDniSubmit = async () => {
    if (honeypot) return;
    if (!turnstileDni.token) {
      setErrorDni("Completá la verificación de seguridad.");
      return;
    }
    setErrorDni("");
    setLoadingDni(true);
    try {
      const result = await authService.resolveDni(dni.trim(), turnstileDni.token);
      const existing = result.existingClient ?? null;
      setExistingFromResolve(existing);
      setExistingMaskedEmail(existing?.maskedEmail || "");

      if (result.identities.length > 1) {
        setIdentities(result.identities);
        setStep(STEP.IDENTITY);
      } else if (result.identities.length === 1) {
        setSelectedCuit(result.identities[0].cuit);
        setStep(nextStepFromExisting(existing));
      } else {
        const msg =
          result.padronOk === false
            ? "Por motivos ajenos a nosotros no pudimos verificar tu identidad en este momento. Por favor, intentá más tarde o contactate con un asesor."
            : "No pudimos verificar tu identidad con este DNI. Si creés que es un error, contactate con un asesor.";
        setErrorDni(msg);
        turnstileDni.reset();
      }
    } catch (err) {
      setErrorDni(err.message || "No pudimos verificar tu DNI. Intentá de nuevo.");
      turnstileDni.reset();
    } finally {
      setLoadingDni(false);
    }
  };

  const handleIdentitySelect = (cuit) => {
    setSelectedCuit(cuit);
    const match = existingFromResolve?.cuit === cuit ? existingFromResolve : null;
    setExistingMaskedEmail(match?.maskedEmail || "");
    setStep(nextStepFromExisting(match));
  };

  const handleRegister = async () => {
    if (honeypot) return;
    if (!turnstileReg.token) {
      setErrorReg("Completá la verificación de seguridad.");
      return;
    }
    setErrorReg("");
    setLoadingReg(true);
    try {
      await authService.register(email.trim(), password, turnstileReg.token, selectedCuit);
      // Misma respuesta si el mail es nuevo o ya existía (anti-enumeración).
      // No dejamos al usuario en "verificá tu mail" esperando un código que
      // a veces no sale: el alta nueva verifica al ingresar (login → OTP).
      writeAuthFlash(
        "Si el email es nuevo, te mandamos un código. Si ya tenés cuenta, ingresá con tu contraseña.",
      );
      navigate("/ingresar", { replace: true, state: { from: location.state?.from } });
    } catch (err) {
      setErrorReg(err.message || "No pudimos crear la cuenta. Intentá de nuevo.");
      turnstileReg.reset();
    } finally {
      setLoadingReg(false);
    }
  };

  const handleExistingClientRegister = async () => {
    if (honeypot) return;
    if (!turnstileExisting.token) {
      setErrorExisting("Completá la verificación de seguridad.");
      return;
    }
    setErrorExisting("");
    setLoadingExisting(true);
    try {
      const result = await authService.registerExistingClient(
        selectedCuit,
        passwordExisting,
        turnstileExisting.token,
      );
      if (result.alreadyVerified) {
        setExistingMaskedEmail(result.maskedEmail || existingMaskedEmail);
        setStep(STEP.ALREADY_REGISTERED);
        return;
      }
      setExistingFullEmail(result.email);
      setStep(STEP.VERIFY);
    } catch (err) {
      setErrorExisting(err.message || "No pudimos crear la cuenta. Intentá de nuevo.");
      turnstileExisting.reset();
    } finally {
      setLoadingExisting(false);
    }
  };

  const emailParaVerificar = existingFullEmail || email.trim();

  const handleVerify = async (code) => {
    if (!turnstileVerify.token) {
      setErrorVerify("Completá la verificación de seguridad.");
      return;
    }
    setErrorVerify("");
    setLoadingVerify(true);
    try {
      await authService.verifyEmail(emailParaVerificar, code, turnstileVerify.token);
      writeAuthFlash("¡Cuenta creada! Ya podés ingresar con tu contraseña.");
      navigate("/ingresar", { replace: true, state: { from: location.state?.from } });
    } catch (err) {
      setErrorVerify(err.message || "El código es inválido o expiró. Pedí uno nuevo.");
      turnstileVerify.reset();
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleResend = async () => {
    if (!turnstileVerify.token) {
      setErrorVerify("Completá la verificación de seguridad.");
      return;
    }
    try {
      await authService.resendOtp(emailParaVerificar, turnstileVerify.token);
    } catch {
      // Respuesta siempre genérica
    } finally {
      turnstileVerify.reset();
    }
  };

  if (step === STEP.VERIFY) {
    return (
      <RegisterVerifyStep
        destination={existingMaskedEmail || email.trim()}
        onValidate={handleVerify}
        onResend={handleResend}
        onBack={() => setStep(existingFullEmail ? STEP.EXISTING : STEP.REGISTER)}
        loading={loadingVerify}
        error={errorVerify}
        turnstile={turnstileVerify}
      />
    );
  }

  if (step === STEP.ALREADY_REGISTERED) {
    return (
      <RegisterAlreadyRegisteredStep
        maskedEmail={existingMaskedEmail}
        onLogin={() => navigate("/ingresar", { state: location.state })}
        onBack={goBackIdentityOrDni}
      />
    );
  }

  if (step === STEP.EXISTING) {
    return (
      <RegisterExistingStep
        maskedEmail={existingMaskedEmail}
        password={passwordExisting}
        setPassword={setPasswordExisting}
        honeypot={honeypot}
        setHoneypot={setHoneypot}
        turnstile={turnstileExisting}
        loading={loadingExisting}
        error={errorExisting}
        onSubmit={handleExistingClientRegister}
        onBack={goBackIdentityOrDni}
      />
    );
  }

  if (step === STEP.IDENTITY) {
    return (
      <RegisterIdentityStep
        identities={identities}
        onSelect={handleIdentitySelect}
        onBack={() => setStep(STEP.DNI)}
      />
    );
  }

  if (step === STEP.REGISTER) {
    return (
      <RegisterNewStep
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        honeypot={honeypot}
        setHoneypot={setHoneypot}
        turnstile={turnstileReg}
        loading={loadingReg}
        error={errorReg}
        onSubmit={handleRegister}
        onBack={goBackIdentityOrDni}
        locationState={location.state}
      />
    );
  }

  return (
    <RegisterDniStep
      dni={dni}
      setDni={setDni}
      honeypot={honeypot}
      setHoneypot={setHoneypot}
      turnstile={turnstileDni}
      loading={loadingDni}
      error={errorDni}
      onSubmit={handleDniSubmit}
      locationState={location.state}
    />
  );
};

export default RegisterScreen;
