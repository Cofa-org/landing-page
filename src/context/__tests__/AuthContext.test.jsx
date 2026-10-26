import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../AuthContext.jsx";
import { AUTH_SESSION_CONFIG, AUTH_SESSION_EVENT } from "../../constants/AUTH.js";
import { consumeAuthFlash } from "../../screens/auth/authFlash.js";

vi.mock("../../services/authService", () => ({
  default: {
    me: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

import authService from "../../services/authService";

function Probe() {
  const { user, loading, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="email">{user?.email ?? "none"}</span>
      <button type="button" onClick={() => login("a@b.com", "p", "t")}>login</button>
      <button type="button" onClick={() => logout()}>logout</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authService.me.mockResolvedValue({ email: "cookie@b.com" });
    authService.login.mockResolvedValue({ email: "login@b.com" });
    authService.logout.mockResolvedValue({ success: true });
  });

  it("al montar llama me y guarda el usuario", async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("email").textContent).toBe("cookie@b.com"));
    expect(authService.me).toHaveBeenCalled();
  });

  it("login usa la respuesta del POST y no llama me de nuevo", async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    authService.me.mockClear();
    screen.getByText("login").click();
    await waitFor(() => expect(screen.getByTestId("email").textContent).toBe("login@b.com"));
    expect(authService.login).toHaveBeenCalled();
    expect(authService.me).not.toHaveBeenCalled();
  });

  it("useAuth fuera del Provider tira", () => {
    expect(() => render(<Probe />)).toThrow(/AuthProvider/);
  });

  describe("vencimiento de sesión", () => {
    const originalLocation = window.location;

    beforeEach(() => {
      Object.defineProperty(window, "location", {
        configurable: true,
        value: { pathname: "/mi-perfil", assign: vi.fn() },
      });
      consumeAuthFlash();
    });

    afterEach(() => {
      vi.useRealTimers();
      Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
    });

    const renderLoggedIn = async () => {
      render(
        <AuthProvider>
          <Probe />
        </AuthProvider>,
      );
      await waitFor(() => expect(screen.getByTestId("email").textContent).toBe("cookie@b.com"));
    };

    it("sesión vencida: deja el aviso y recarga en el login", async () => {
      await renderLoggedIn();
      act(() => {
        window.dispatchEvent(new Event(AUTH_SESSION_EVENT.EXPIRED));
      });
      expect(window.location.assign).toHaveBeenCalledWith("/ingresar");
      expect(consumeAuthFlash()).toBe(AUTH_SESSION_CONFIG.EXPIRED_MESSAGE);
    });

    it("sesión vencida estando en el login: solo limpia el usuario", async () => {
      window.location.pathname = "/ingresar";
      await renderLoggedIn();
      act(() => {
        window.dispatchEvent(new Event(AUTH_SESSION_EVENT.EXPIRED));
      });
      expect(screen.getByTestId("email").textContent).toBe("none");
      expect(window.location.assign).not.toHaveBeenCalled();
    });

    it("al montar con una sesión invalidada deja el aviso", async () => {
      authService.me.mockRejectedValue(Object.assign(new Error("x"), { cause: "AUTH_SESSION_INVALID" }));
      render(
        <AuthProvider>
          <Probe />
        </AuthProvider>,
      );
      await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
      expect(consumeAuthFlash()).toBe(AUTH_SESSION_CONFIG.EXPIRED_MESSAGE);
    });

    it("al montar sin cookie no deja aviso", async () => {
      authService.me.mockRejectedValue(Object.assign(new Error("x"), { cause: "AUTH_SESSION_REQUIRED" }));
      render(
        <AuthProvider>
          <Probe />
        </AuthProvider>,
      );
      await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
      expect(consumeAuthFlash()).toBe("");
    });

    it("sin usuario no reacciona al evento", async () => {
      authService.me.mockRejectedValue(new Error("sin sesión"));
      render(
        <AuthProvider>
          <Probe />
        </AuthProvider>,
      );
      await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
      window.dispatchEvent(new Event(AUTH_SESSION_EVENT.EXPIRED));
      expect(window.location.assign).not.toHaveBeenCalled();
    });

    it("tras 30 min sin pedidos consulta al back; la actividad reinicia la cuenta", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      await renderLoggedIn();
      authService.me.mockClear();

      act(() => {
        vi.advanceTimersByTime(AUTH_SESSION_CONFIG.IDLE_MS - 1000);
        window.dispatchEvent(new Event(AUTH_SESSION_EVENT.ACTIVITY));
        vi.advanceTimersByTime(AUTH_SESSION_CONFIG.IDLE_MS - 1000);
      });
      expect(authService.me).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(authService.me).toHaveBeenCalledTimes(1);
    });
  });
});
