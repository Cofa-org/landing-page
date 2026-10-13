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
