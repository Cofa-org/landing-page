// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mockNavigate = vi.fn();
const mockLogin = vi.fn();

vi.mock("../../../../../context/index.js", () => ({
  useAuth: () => ({ login: mockLogin, logout: vi.fn(), user: null, loading: false }),
}));

vi.mock("../../../../../services/authService.js", () => ({
  default: {
    verifyEmail: vi.fn(),
    resendOtp: vi.fn(),
  },
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

import authService from "../../../../../services/authService.js";
import { useLoginFlow } from "../useLoginFlow.js";

const wrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>;

describe("useLoginFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("honeypot relleno no llama a login", async () => {
    const { result } = renderHook(() => useLoginFlow(), { wrapper });
    act(() => {
      result.current.setEmail("a@b.com");
      result.current.setPassword("password1");
      result.current.setHoneypot("bot");
    });
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("AUTH_EMAIL_NOT_VERIFIED pasa a needsVerify sin navegar", async () => {
    const err = new Error("not verified");
    err.cause = "AUTH_EMAIL_NOT_VERIFIED";
    mockLogin.mockRejectedValue(err);

    const { result } = renderHook(() => useLoginFlow(), { wrapper });
    act(() => {
      result.current.setEmail("a@b.com");
      result.current.setPassword("password1");
    });
    // token vacío: handleSubmit corta antes. Forzamos el camino de login
    // seteando honeypot vacío y mockeando turnstile via submit con token:
    // el hook exige turnstile.token. Simulamos el error inyectando login
    // después de que el token exista — en jsdom Turnstile no corre, así que
    // comprobamos el branch asignando needsVerify con el mismo catch.
    await act(async () => {
      result.current.turnstile.onVerify("tok");
    });
    await act(async () => {
      await result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(result.current.needsVerify).toBe(true);
    });
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(result.current.error).toBe("");
  });

  const goToVerifyStep = async (result) => {
    const err = new Error("not verified");
    err.cause = "AUTH_EMAIL_NOT_VERIFIED";
    mockLogin.mockRejectedValueOnce(err);
    act(() => {
      result.current.setEmail("a@b.com");
      result.current.setPassword("password1");
      result.current.turnstile.onVerify("tok-login");
    });
    await act(async () => {
      await result.current.handleSubmit();
    });
  };

  it("pasar al código descarta el token de login ya usado", async () => {
    const { result } = renderHook(() => useLoginFlow(), { wrapper });
    await goToVerifyStep(result);

    expect(result.current.needsVerify).toBe(true);
    expect(result.current.turnstile.token).toBe("");
  });

  it("código verificado: vuelve al formulario con mensaje, sin navegar", async () => {
    authService.verifyEmail.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useLoginFlow(), { wrapper });
    await goToVerifyStep(result);

    act(() => {
      result.current.turnstileVerify.onVerify("tok-verify");
    });
    await act(async () => {
      await result.current.handleVerify("123456");
    });

    expect(authService.verifyEmail).toHaveBeenCalledWith("a@b.com", "123456", "tok-verify");
    expect(result.current.needsVerify).toBe(false);
    expect(result.current.successMessage).toBe("¡Email confirmado! Ya podés ingresar.");
    expect(result.current.error).toBe("");
    expect(result.current.email).toBe("a@b.com");
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("cofa_auth_flash")).toBeNull();
  });

  it("código inválido: sigue en el paso del código con error", async () => {
    authService.verifyEmail.mockRejectedValue(new Error("El código es inválido"));
    const { result } = renderHook(() => useLoginFlow(), { wrapper });
    await goToVerifyStep(result);

    act(() => {
      result.current.turnstileVerify.onVerify("tok-verify");
    });
    await act(async () => {
      await result.current.handleVerify("000000");
    });

    expect(result.current.needsVerify).toBe(true);
    expect(result.current.error).toBe("El código es inválido");
  });

  it("volver al formulario limpia error y token", async () => {
    const { result } = renderHook(() => useLoginFlow(), { wrapper });
    await goToVerifyStep(result);

    act(() => {
      result.current.turnstile.onVerify("tok-nuevo");
      result.current.goBackToForm();
    });

    expect(result.current.needsVerify).toBe(false);
    expect(result.current.turnstile.token).toBe("");
  });

  it("login ok navega a /mi-perfil", async () => {
    mockLogin.mockResolvedValue({ email: "a@b.com" });
    const { result } = renderHook(() => useLoginFlow(), { wrapper });
    act(() => {
      result.current.setEmail("a@b.com");
      result.current.setPassword("password1");
      result.current.turnstile.onVerify("tok");
    });
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(mockLogin).toHaveBeenCalledWith("a@b.com", "password1", "tok");
    expect(mockNavigate).toHaveBeenCalledWith("/mi-perfil", { replace: true });
  });
});
