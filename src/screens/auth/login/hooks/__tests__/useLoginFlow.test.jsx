// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mockNavigate = vi.fn();
const mockLogin = vi.fn();

vi.mock("../../../../../context/index.js", () => ({
  useAuth: () => ({ login: mockLogin, logout: vi.fn(), user: null, loading: false }),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

import { useLoginFlow } from "../useLoginFlow.js";

const wrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>;

describe("useLoginFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  const submit = async (result, email = "a@b.com") => {
    act(() => {
      result.current.setEmail(email);
      result.current.setPassword("password1");
      result.current.turnstile.onVerify("tok");
    });
    await act(async () => {
      await result.current.handleSubmit();
    });
  };

  const loginFailed = (captchaMode) => {
    const err = new Error("fail");
    err.cause = "AUTH_LOGIN_FAILED";
    err.data = { captchaMode, bloqueado_hasta: null, delayMs: 0 };
    return err;
  };

  const turnstileInvalid = () => {
    const err = new Error("Verificación de seguridad fallida. Por favor, intentá nuevamente.");
    err.cause = "TURNSTILE_INVALID";
    return err;
  };

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

  it("login fallido muestra el error genérico y descarta el token usado", async () => {
    const err = new Error("Email o contraseña incorrectos");
    err.cause = "AUTH_LOGIN_FAILED";
    mockLogin.mockRejectedValue(err);
    const { result } = renderHook(() => useLoginFlow(), { wrapper });

    await submit(result);

    expect(result.current.error).toBe("Email o contraseña incorrectos");
    expect(result.current.turnstile.token).toBe("");
    expect(result.current).not.toHaveProperty("needsVerify");
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("captchaMode managed: pasa a widget visible en el siguiente intento", async () => {
    const err = new Error("fail");
    err.cause = "AUTH_LOGIN_FAILED";
    err.data = { captchaMode: "managed", bloqueado_hasta: null, delayMs: 0 };
    mockLogin.mockRejectedValue(err);
    const { result } = renderHook(() => useLoginFlow(), { wrapper });

    await submit(result);

    expect(result.current.captchaMode).toBe("managed");
    expect(result.current.turnstile.token).toBe("");
  });

  describe("modo de CAPTCHA según email y señales del back (H05)", () => {
    it("otro email vuelve a invisible y al regresar al email anterior recupera managed", async () => {
      mockLogin.mockRejectedValue(loginFailed("managed"));
      const { result } = renderHook(() => useLoginFlow(), { wrapper });
      await submit(result, "a@b.com");
      expect(result.current.captchaMode).toBe("managed");

      act(() => result.current.setEmail("otro@b.com"));
      expect(result.current.captchaMode).toBe("invisible");

      act(() => result.current.setEmail("a@b.com"));
      expect(result.current.captchaMode).toBe("managed");
    });

    it("compara el email normalizado: espacios y mayúsculas no cambian el modo", async () => {
      mockLogin.mockRejectedValue(loginFailed("managed"));
      const { result } = renderHook(() => useLoginFlow(), { wrapper });
      await submit(result, "a@b.com");

      act(() => result.current.setEmail("  A@B.com "));
      expect(result.current.captchaMode).toBe("managed");
    });

    it("cambiar de modo descarta el token del widget anterior", async () => {
      mockLogin.mockRejectedValue(loginFailed("managed"));
      const { result } = renderHook(() => useLoginFlow(), { wrapper });
      await submit(result, "a@b.com");
      act(() => result.current.turnstile.onVerify("tok-managed"));

      act(() => result.current.setEmail("otro@b.com"));
      expect(result.current.captchaMode).toBe("invisible");
      expect(result.current.turnstile.token).toBe("");
    });

    it("sin cambio de modo conserva el token al editar el email", () => {
      const { result } = renderHook(() => useLoginFlow(), { wrapper });
      act(() => result.current.turnstile.onVerify("tok"));
      act(() => result.current.setEmail("otro@b.com"));
      expect(result.current.turnstile.token).toBe("tok");
    });

    it("adopta invisible cuando el back lo devuelve después de managed", async () => {
      mockLogin.mockRejectedValueOnce(loginFailed("managed")).mockRejectedValueOnce(loginFailed("invisible"));
      const { result } = renderHook(() => useLoginFlow(), { wrapper });
      await submit(result, "a@b.com");
      expect(result.current.captchaMode).toBe("managed");

      await submit(result, "a@b.com");
      expect(result.current.captchaMode).toBe("invisible");
    });

    it("TURNSTILE_INVALID estando en managed vuelve a invisible para ese email", async () => {
      mockLogin.mockRejectedValueOnce(loginFailed("managed")).mockRejectedValueOnce(turnstileInvalid());
      const { result } = renderHook(() => useLoginFlow(), { wrapper });
      await submit(result, "a@b.com");
      await submit(result, "a@b.com");

      expect(result.current.captchaMode).toBe("invisible");
      expect(result.current.error).toBe("Verificación de seguridad fallida. Por favor, intentá nuevamente.");
    });

    it("TURNSTILE_INVALID estando en invisible no cambia el modo", async () => {
      mockLogin.mockRejectedValue(turnstileInvalid());
      const { result } = renderHook(() => useLoginFlow(), { wrapper });
      await submit(result, "a@b.com");
      expect(result.current.captchaMode).toBe("invisible");
    });

    it("un error sin señales no altera el modo vigente", async () => {
      const sinSenales = new Error("Error de red");
      mockLogin.mockRejectedValueOnce(loginFailed("managed")).mockRejectedValueOnce(sinSenales);
      const { result } = renderHook(() => useLoginFlow(), { wrapper });
      await submit(result, "a@b.com");
      await submit(result, "a@b.com");
      expect(result.current.captchaMode).toBe("managed");
    });
  });

  it("muestra el aviso que dejó el registro", () => {
    sessionStorage.setItem("cofa_auth_flash", "¡Cuenta creada! Ya podés ingresar con tu contraseña.");
    const { result } = renderHook(() => useLoginFlow(), { wrapper });
    expect(result.current.successMessage).toBe("¡Cuenta creada! Ya podés ingresar con tu contraseña.");
  });

  it("login ok navega a /mi-perfil", async () => {
    mockLogin.mockResolvedValue({ email: "a@b.com" });
    const { result } = renderHook(() => useLoginFlow(), { wrapper });

    await submit(result);

    expect(mockLogin).toHaveBeenCalledWith("a@b.com", "password1", "tok");
    expect(mockNavigate).toHaveBeenCalledWith("/mi-perfil", { replace: true });
  });
});
