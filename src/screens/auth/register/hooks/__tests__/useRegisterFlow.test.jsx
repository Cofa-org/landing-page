// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mockNavigate = vi.fn();

vi.mock("../../../../../services/authService.js", () => ({
  default: {
    resolveDni: vi.fn(),
    register: vi.fn(),
    registerExistingClient: vi.fn(),
    verifyEmail: vi.fn(),
    resendOtp: vi.fn(),
    completeRegistration: vi.fn(),
  },
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

import authService from "../../../../../services/authService.js";
import { useRegisterFlow, STEP } from "../useRegisterFlow.js";

const wrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>;

const PASSWORD = "passphrase-de-prueba-1";

/** DNI con identidad única y sin cuenta previa: deja el flujo en el paso del email. */
const startNewUser = async (result) => {
  authService.resolveDni.mockResolvedValue({
    identities: [{ cuit: "20301234568", nombreCompleto: "Juan Pérez" }],
    existingClient: null,
  });
  act(() => {
    result.current.setDni("30123456");
    result.current.turnstileDni.onVerify("tok-dni");
  });
  await act(async () => {
    await result.current.handleDniSubmit();
  });
};

const registerEmail = async (result) => {
  authService.register.mockResolvedValue({ success: true });
  act(() => {
    result.current.setEmail("nuevo@test.com");
    result.current.turnstileReg.onVerify("tok-reg");
  });
  await act(async () => {
    await result.current.handleRegister();
  });
};

const verifyCode = async (result) => {
  authService.verifyEmail.mockResolvedValue({ success: true, registrationToken: "rt_123456789" });
  act(() => {
    result.current.turnstileVerify.onVerify("tok-verify");
  });
  await act(async () => {
    await result.current.handleVerify("123456");
  });
};

const submitPassword = async (result, { confirm = PASSWORD } = {}) => {
  act(() => {
    result.current.setNewPassword(PASSWORD);
    result.current.setConfirmPassword(confirm);
    result.current.turnstilePassword.onVerify("tok-pass");
  });
  await act(async () => {
    await result.current.handleCompleteRegistration();
  });
};

describe("useRegisterFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("alta nueva: email solo, pasa al código sin navegar", async () => {
    const { result } = renderHook(() => useRegisterFlow(), { wrapper });
    await startNewUser(result);
    expect(result.current.step).toBe(STEP.REGISTER);

    await registerEmail(result);

    expect(authService.register).toHaveBeenCalledWith("nuevo@test.com", "tok-reg");
    expect(result.current.step).toBe(STEP.VERIFY);
    expect(result.current.turnstileReg.token).toBe("");
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("código correcto pasa al paso de contraseña con el token de registro", async () => {
    const { result } = renderHook(() => useRegisterFlow(), { wrapper });
    await startNewUser(result);
    await registerEmail(result);

    await verifyCode(result);

    expect(authService.verifyEmail).toHaveBeenCalledWith("nuevo@test.com", "123456", "tok-verify");
    expect(result.current.step).toBe(STEP.PASSWORD);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("contraseña: completa el registro con token, contraseña, CUIT y Turnstile y va a /ingresar", async () => {
    authService.completeRegistration.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useRegisterFlow(), { wrapper });
    await startNewUser(result);
    await registerEmail(result);
    await verifyCode(result);

    await submitPassword(result);

    expect(authService.completeRegistration).toHaveBeenCalledWith(
      "rt_123456789",
      PASSWORD,
      "20301234568",
      "tok-pass",
    );
    expect(mockNavigate).toHaveBeenCalledWith("/ingresar", {
      replace: true,
      state: { from: undefined },
    });
    expect(sessionStorage.getItem("cofa_auth_flash")).toMatch(/cuenta creada/i);
  });

  it("contraseñas distintas: no llama al backend", async () => {
    const { result } = renderHook(() => useRegisterFlow(), { wrapper });
    await startNewUser(result);
    await registerEmail(result);
    await verifyCode(result);

    await submitPassword(result, { confirm: "otra-cosa-1!" });

    expect(authService.completeRegistration).not.toHaveBeenCalled();
    expect(result.current.errorPassword).toBe("Las contraseñas no coinciden.");
  });

  it("contraseña rechazada (HIBP): sigue en el paso con el error, sin volver a empezar", async () => {
    const err = new Error("Esta contraseña apareció en filtraciones");
    err.cause = "AUTH_PASSWORD_PWNED";
    authService.completeRegistration.mockRejectedValue(err);
    const { result } = renderHook(() => useRegisterFlow(), { wrapper });
    await startNewUser(result);
    await registerEmail(result);
    await verifyCode(result);

    await submitPassword(result);

    expect(result.current.step).toBe(STEP.PASSWORD);
    expect(result.current.registrationExpired).toBe(false);
    expect(result.current.errorPassword).toBe("Esta contraseña apareció en filtraciones");
    expect(result.current.turnstilePassword.token).toBe("");
  });

  it("token de registro vencido: ofrece volver a empezar y vuelve al email conservando la identidad", async () => {
    const err = new Error("El tiempo para crear la contraseña venció. Volvé a empezar el registro");
    err.cause = "AUTH_REGISTRATION_INVALID";
    authService.completeRegistration.mockRejectedValue(err);
    const { result } = renderHook(() => useRegisterFlow(), { wrapper });
    await startNewUser(result);
    await registerEmail(result);
    await verifyCode(result);
    await submitPassword(result);

    expect(result.current.registrationExpired).toBe(true);
    expect(result.current.errorPassword).toMatch(/venció/);

    act(() => {
      result.current.restartRegistration();
    });

    expect(result.current.step).toBe(STEP.REGISTER);
    expect(result.current.registrationExpired).toBe(false);
    expect(result.current.newPassword).toBe("");
    expect(result.current.email).toBe("nuevo@test.com");

    authService.register.mockResolvedValue({ success: true });
    act(() => {
      result.current.turnstileReg.onVerify("tok-reg-2");
    });
    await act(async () => {
      await result.current.handleRegister();
    });
    expect(authService.register).toHaveBeenLastCalledWith("nuevo@test.com", "tok-reg-2");
  });

  it("cliente existente no verificado: solo CUIT, pasa a VERIFY con el email completo", async () => {
    authService.registerExistingClient.mockResolvedValue({
      email: "full@test.com",
      maskedEmail: "f****@t.com",
      alreadyVerified: false,
    });
    const { result } = renderHook(() => useRegisterFlow(), { wrapper });

    act(() => {
      result.current.turnstileExisting.onVerify("tok");
    });
    await act(async () => {
      await result.current.handleExistingClientRegister();
    });

    expect(authService.registerExistingClient).toHaveBeenCalledWith(null, "tok");
    expect(result.current.step).toBe(STEP.VERIFY);

    await verifyCode(result);
    expect(authService.verifyEmail).toHaveBeenCalledWith("full@test.com", "123456", "tok-verify");
    expect(result.current.step).toBe(STEP.PASSWORD);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("cliente existente con cuenta activa: ALREADY_REGISTERED", async () => {
    authService.registerExistingClient.mockResolvedValue({
      email: "full@test.com",
      maskedEmail: "f****@t.com",
      alreadyVerified: true,
    });
    const { result } = renderHook(() => useRegisterFlow(), { wrapper });

    act(() => {
      result.current.turnstileExisting.onVerify("tok");
    });
    await act(async () => {
      await result.current.handleExistingClientRegister();
    });

    expect(result.current.step).toBe(STEP.ALREADY_REGISTERED);
  });
});
