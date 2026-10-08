import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../AuthContext.jsx";

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
});
