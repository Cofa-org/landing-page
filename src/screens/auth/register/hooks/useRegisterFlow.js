import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import authService from "../../../../services/authService.js";
import { useTurnstile } from "../../useTurnstile.js";
import { writeAuthFlash } from "../../authFlash.js";

export const STEP = {
  DNI: "dni",
  IDENTITY: "identity",
  REGISTER: "register",
  EXISTING: "existing",
  ALREADY_REGISTERED: "already_registered",
  VERIFY: "verify",
  PASSWORD: "password",
};

export const REGISTRATION_INVALID_CAUSE = "AUTH_REGISTRATION_INVALID";

export const nextStepFromExisting = (existingClient) => {
  if (!existingClient?.maskedEmail) return STEP.REGISTER;
  if (existingClient.alreadyRegistered && existingClient.verified) {
    return STEP.ALREADY_REGISTERED;
  }
  return STEP.EXISTING;
};

export function useRegisterFlow() {
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
  const [honeypot, setHoneypot] = useState("");
  const [registrationToken, setRegistrationToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registrationExpired, setRegistrationExpired] = useState(false);

  const turnstileDni = useTurnstile();
  const turnstileReg = useTurnstile();
  const turnstileExisting = useTurnstile();
  const turnstileVerify = useTurnstile();
  const turnstilePassword = useTurnstile();

  const [loadingDni, setLoadingDni] = useState(false);
  const [errorDni, setErrorDni] = useState("");
  const [loadingReg, setLoadingReg] = useState(false);
  const [errorReg, setErrorReg] = useState("");
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [errorExisting, setErrorExisting] = useState("");
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [errorVerify, setErrorVerify] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [errorPassword, setErrorPassword] = useState("");

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

  // Respuesta genérica: se pasa al código exista o no una cuenta activa con ese email.
  const handleRegister = async () => {
    if (honeypot) return;
    if (!turnstileReg.token) {
      setErrorReg("Completá la verificación de seguridad.");
      return;
    }
    setErrorReg("");
    setLoadingReg(true);
    try {
      await authService.register(email.trim(), turnstileReg.token);
      turnstileReg.reset();
      setExistingFullEmail("");
      setStep(STEP.VERIFY);
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
      const result = await authService.registerExistingClient(selectedCuit, turnstileExisting.token);
      turnstileExisting.reset();
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
      const result = await authService.verifyEmail(emailParaVerificar, code, turnstileVerify.token);
      turnstileVerify.reset();
      setRegistrationToken(result.registrationToken);
      setRegistrationExpired(false);
      setErrorPassword("");
      setStep(STEP.PASSWORD);
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

  const handleCompleteRegistration = async () => {
    if (honeypot) return;
    if (newPassword !== confirmPassword) {
      setErrorPassword("Las contraseñas no coinciden.");
      return;
    }
    if (!turnstilePassword.token) {
      setErrorPassword("Completá la verificación de seguridad.");
      return;
    }
    setErrorPassword("");
    setLoadingPassword(true);
    try {
      await authService.completeRegistration(
        registrationToken,
        newPassword,
        selectedCuit,
        turnstilePassword.token,
      );
      writeAuthFlash("¡Cuenta creada! Ya podés ingresar con tu contraseña.");
      navigate("/ingresar", { replace: true, state: { from: location.state?.from } });
    } catch (err) {
      if (err.cause === REGISTRATION_INVALID_CAUSE) setRegistrationExpired(true);
      setErrorPassword(err.message || "No pudimos crear la cuenta. Intentá de nuevo.");
      turnstilePassword.reset();
    } finally {
      setLoadingPassword(false);
    }
  };

  // El token de registro venció o fue anulado: se vuelve al paso del email conservando DNI e identidad.
  const restartRegistration = () => {
    setRegistrationToken("");
    setNewPassword("");
    setConfirmPassword("");
    setRegistrationExpired(false);
    setErrorPassword("");
    turnstilePassword.reset();
    setStep(existingFullEmail ? STEP.EXISTING : STEP.REGISTER);
  };

  return {
    step,
    STEP,
    locationState: location.state,
    dni,
    setDni,
    identities,
    existingMaskedEmail,
    email,
    setEmail,
    honeypot,
    setHoneypot,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    registrationExpired,
    turnstileDni,
    turnstileReg,
    turnstileExisting,
    turnstileVerify,
    turnstilePassword,
    loadingDni,
    errorDni,
    loadingReg,
    errorReg,
    loadingExisting,
    errorExisting,
    loadingVerify,
    errorVerify,
    loadingPassword,
    errorPassword,
    goBackIdentityOrDni,
    handleDniSubmit,
    handleIdentitySelect,
    handleRegister,
    handleExistingClientRegister,
    handleVerify,
    handleResend,
    handleCompleteRegistration,
    restartRegistration,
    goToLogin: () => navigate("/ingresar", { state: location.state }),
    goBackFromVerify: () => setStep(existingFullEmail ? STEP.EXISTING : STEP.REGISTER),
    goBackToDni: () => setStep(STEP.DNI),
    verifyDestination: existingMaskedEmail || email.trim(),
  };
}
