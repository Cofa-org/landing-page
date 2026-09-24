/**
 * Tests temporales — Honeypot en formularios de auth (frontend)
 * Verifican que el campo oculto existe y que un submit con el honeypot relleno
 * no dispara la acción real (login / register / forgot / reset).
 * Pueden eliminarse una vez confirmado el funcionamiento manual.
 */

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

/* ── Stubs de componentes pesados ──────────────────────────────────── */
// Header y Footer tienen muchas dependencias — los stubeamos para aislar la lógica del form.
vi.mock("../../../Components/index.js", () => ({
  Header: () => <div data-testid="header-stub" />,
  Footer: () => <div data-testid="footer-stub" />,
}));

// Turnstile → llama onVerify inmediatamente al montar (simula resolución del challenge)
vi.mock("../../../Components/Turnstile/Turnstile.jsx", () => ({
  default: vi.fn(({ onVerify }) => {
    onVerify("fake-turnstile-token");
    return <div data-testid="turnstile-stub" />;
  }),
}));

vi.mock("../../../config.js", () => ({
  TURNSTILE_SITE_KEY: "test-site-key",
}));

// Context: conservamos todos los exports reales y sobreescribimos solo useAuth
vi.mock("../../../context/index.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: vi.fn(() => ({
      login: vi.fn(),
      logout: vi.fn(),
      user: null,
      loading: false,
    })),
    useScrollContext: vi.fn(() => ({ scrolled: false })),
  };
});

vi.mock("../../../services/authService.js", () => ({
  default: {
    register:       vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword:  vi.fn(),
    resendOtp:      vi.fn(),
    verifyEmail:    vi.fn(),
  },
}));

/* ── Helpers ────────────────────────────────────────────────────────── */
function renderInRouter(ui, { route = "/" } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
  );
}

/** Rellena el honeypot y dispara el evento change para que React actualice el estado */
function fillHoneypot(container) {
  const hp = container.querySelector('input[name="website"]');
  expect(hp, "Campo honeypot name=website debe existir").not.toBeNull();
  fireEvent.change(hp, { target: { value: "bot_value" } });
}

/** Rellena un campo por su atributo name */
function fillByName(container, name, value) {
  const el = container.querySelector(`input[name="${name}"]`);
  expect(el, `Input name="${name}" debe existir`).not.toBeNull();
  fireEvent.change(el, { target: { value } });
}

/* ══════════════════════════════════════════════════════════════════════
   LoginScreen
═══════════════════════════════════════════════════════════════════════*/
describe("LoginScreen — honeypot", () => {
  let LoginScreen;
  let loginMock;
  let useAuth;

  beforeEach(async () => {
    vi.clearAllMocks();
    LoginScreen = (await import("../LoginScreen.jsx")).default;
    ({ useAuth } = await import("../../../context/index.js"));
    loginMock = vi.fn().mockResolvedValue(undefined);
    useAuth.mockReturnValue({ login: loginMock, logout: vi.fn(), user: null, loading: false });
  });

  it("tiene un campo honeypot oculto name=website", () => {
    const { container } = renderInRouter(<LoginScreen />);
    const hp = container.querySelector('input[name="website"]');
    expect(hp).toBeTruthy();
    expect(hp.getAttribute("tabindex")).toBe("-1");
    expect(hp.getAttribute("aria-hidden")).toBe("true");
  });

  it("no llama a login si el honeypot está relleno", async () => {
    const { container } = renderInRouter(<LoginScreen />);

    fillByName(container, "email", "test@test.com");
    fillByName(container, "password", "password123");
    fillHoneypot(container);

    fireEvent.click(screen.getByRole("button", { name: /ingresar/i }));

    await waitFor(() => {
      expect(loginMock).not.toHaveBeenCalled();
    });
  });

  it("sí llama a login con los datos correctos si el honeypot está vacío", async () => {
    const { container } = renderInRouter(<LoginScreen />);

    fillByName(container, "email", "test@test.com");
    fillByName(container, "password", "password123");

    fireEvent.click(screen.getByRole("button", { name: /ingresar/i }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith(
        "test@test.com",
        "password123",
        "fake-turnstile-token"
      );
    });
  });
});

/* ══════════════════════════════════════════════════════════════════════
   RegisterScreen
═══════════════════════════════════════════════════════════════════════*/
describe("RegisterScreen — honeypot", () => {
  let RegisterScreen;
  let authService;

  beforeEach(async () => {
    vi.clearAllMocks();
    RegisterScreen = (await import("../RegisterScreen.jsx")).default;
    authService = (await import("../../../services/authService.js")).default;
  });

  it("tiene un campo honeypot oculto en el paso de registro", () => {
    const { container } = renderInRouter(<RegisterScreen />);
    const hp = container.querySelector('input[name="website"]');
    expect(hp).toBeTruthy();
    expect(hp.getAttribute("tabindex")).toBe("-1");
  });

  it("no llama a register si el honeypot está relleno", async () => {
    const { container } = renderInRouter(<RegisterScreen />);

    fillByName(container, "email", "nuevo@test.com");
    fillByName(container, "password", "password123");
    fillHoneypot(container);

    fireEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(authService.register).not.toHaveBeenCalled();
    });
  });

  it("sí llama a register si el honeypot está vacío", async () => {
    authService.register.mockResolvedValue({ success: true });
    const { container } = renderInRouter(<RegisterScreen />);

    fillByName(container, "email", "nuevo@test.com");
    fillByName(container, "password", "password123");

    fireEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith(
        "nuevo@test.com",
        "password123",
        "fake-turnstile-token"
      );
    });
  });
});

/* ══════════════════════════════════════════════════════════════════════
   ForgotPasswordScreen
═══════════════════════════════════════════════════════════════════════*/
describe("ForgotPasswordScreen — honeypot", () => {
  let ForgotPasswordScreen;
  let authService;

  beforeEach(async () => {
    vi.clearAllMocks();
    ForgotPasswordScreen = (await import("../ForgotPasswordScreen.jsx")).default;
    authService = (await import("../../../services/authService.js")).default;
  });

  it("tiene un campo honeypot oculto", () => {
    const { container } = renderInRouter(<ForgotPasswordScreen />);
    expect(container.querySelector('input[name="website"]')).toBeTruthy();
  });

  it("no llama a forgotPassword si el honeypot está relleno", async () => {
    const { container } = renderInRouter(<ForgotPasswordScreen />);

    fillByName(container, "email", "yo@test.com");
    fillHoneypot(container);

    fireEvent.click(screen.getByRole("button", { name: /enviar/i }));

    await waitFor(() => {
      expect(authService.forgotPassword).not.toHaveBeenCalled();
    });
  });
});

/* ══════════════════════════════════════════════════════════════════════
   ResetPasswordScreen
═══════════════════════════════════════════════════════════════════════*/
describe("ResetPasswordScreen — honeypot", () => {
  let ResetPasswordScreen;
  let authService;
  let useAuth;

  beforeEach(async () => {
    vi.clearAllMocks();
    ResetPasswordScreen = (await import("../ResetPasswordScreen.jsx")).default;
    authService = (await import("../../../services/authService.js")).default;
    ({ useAuth } = await import("../../../context/index.js"));
    useAuth.mockReturnValue({ login: vi.fn(), logout: vi.fn(), user: null, loading: false });
  });

  it("tiene un campo honeypot oculto", () => {
    const { container } = renderInRouter(<ResetPasswordScreen />, { route: "/?token=valid-token-12345" });
    expect(container.querySelector('input[name="website"]')).toBeTruthy();
  });

  it("no llama a resetPassword si el honeypot está relleno", async () => {
    const { container } = renderInRouter(<ResetPasswordScreen />, { route: "/?token=valid-token-12345" });

    fillByName(container, "newPassword", "nuevaPass123");
    fillByName(container, "confirmPassword", "nuevaPass123");
    fillHoneypot(container);

    fireEvent.click(screen.getByRole("button", { name: /cambiar contraseña/i }));

    await waitFor(() => {
      expect(authService.resetPassword).not.toHaveBeenCalled();
    });
  });
});
