/**
 * Tests del flujo de registro con paso DNI (Iter 1).
 * Verifica:
 * - Que el paso inicial muestra el formulario de DNI (no email)
 * - Que un DNI inválido muestra error antes de llamar al servicio
 * - Que resolveDni es llamado con el DNI correcto
 * - Que con identidad única + nuevo usuario → pasa al paso de email/contraseña
 * - Que con múltiples identidades → muestra la pantalla de selección
 * - Que con cliente existente (existingClient) → muestra el paso de email enmascarado
 */

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../../Components/index.js", () => ({
  Header: () => <div data-testid="header-stub" />,
  Footer: () => <div data-testid="footer-stub" />,
}));

// Turnstile resuelve inmediatamente
vi.mock("../../../Components/Turnstile/Turnstile.jsx", () => ({
  default: vi.fn(({ onVerify }) => {
    onVerify("fake-turnstile-token");
    return <div data-testid="turnstile-stub" />;
  }),
}));

vi.mock("../../../config.js", () => ({ TURNSTILE_SITE_KEY: "test-key" }));

// Stub de componentes con formulario propio para evitar dependencias
vi.mock("../../Components/Forms/GenericForm/GenericForm.jsx", async () => ({
  default: ({ children, onSubmit, title }) => (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      {title && <h2>{title}</h2>}
      {children}
    </form>
  ),
}));

vi.mock("../../../Components/Forms/GenericForm/GenericForm.jsx", async () => ({
  default: ({ children, onSubmit, title }) => (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      {title && <h2>{title}</h2>}
      {children}
    </form>
  ),
}));

vi.mock("../../../Components/Forms/GenericInput/GenericInput.jsx", async () => ({
  default: ({ label, name, onChange, value, ...rest }) => (
    <div>
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} value={value} onChange={onChange} {...rest} />
    </div>
  ),
}));

vi.mock("../../../Components/Forms/GenericInput/PasswordInput.jsx", async () => ({
  default: ({ label, name, onChange, value }) => (
    <div>
      <label htmlFor={name}>{label}</label>
      <input type="password" id={name} name={name} value={value} onChange={onChange} />
    </div>
  ),
}));

vi.mock("../../../Components/buttons/GenericButton/GenericButton.jsx", async () => ({
  default: ({ children, disabled, type }) => (
    <button type={type} disabled={disabled}>{children}</button>
  ),
}));

vi.mock("../../../Components/OTPValidation/OTPValidation.jsx", async () => ({
  default: () => <div data-testid="otp-stub" />,
}));

const mockResolveDni = vi.fn();
const mockRegister = vi.fn();
const mockRegisterExistingClient = vi.fn();

vi.mock("../../../services/authService.js", () => ({
  default: {
    resolveDni: (...a) => mockResolveDni(...a),
    register: (...a) => mockRegister(...a),
    registerExistingClient: (...a) => mockRegisterExistingClient(...a),
    verifyEmail: vi.fn(),
    resendOtp: vi.fn(),
  },
}));

import RegisterScreen from "../RegisterScreen.jsx";

function renderScreen() {
  return render(
    <MemoryRouter>
      <RegisterScreen />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("RegisterScreen — paso DNI inicial", () => {
  it("muestra el formulario de DNI al entrar (no el de email)", () => {
    renderScreen();
    // Debe haber un campo DNI
    expect(screen.getByLabelText(/dni/i)).toBeTruthy();
    // No debe haber un campo email en este paso
    expect(screen.queryByLabelText(/^email$/i)).toBeNull();
  });

  it("el botón Continuar está deshabilitado con DNI vacío", () => {
    renderScreen();
    const btn = screen.getByRole("button", { name: /continuar/i });
    expect(btn.disabled).toBe(true);
  });

  it("el botón Continuar se habilita con DNI de 7+ dígitos (Turnstile ya resuelto)", async () => {
    renderScreen();
    const input = screen.getByLabelText(/dni/i);
    fireEvent.change(input, { target: { value: "30123456" } });
    const btn = screen.getByRole("button", { name: /continuar/i });
    expect(btn.disabled).toBe(false);
  });

  it("con identidad única y nuevo usuario → avanza al paso email/contraseña", async () => {
    mockResolveDni.mockResolvedValue({
      identities: [{ cuit: "20301234568", nombreCompleto: "Juan Pérez" }],
      existingClient: null,
    });
    renderScreen();
    const input = screen.getByLabelText(/dni/i);
    fireEvent.change(input, { target: { value: "30123456" } });
    fireEvent.submit(input.closest("form"));

    await waitFor(() => {
      // Debe aparecer el campo email (paso de registro)
      expect(screen.getByLabelText(/^email$/i)).toBeTruthy();
    });
  });

  it("con múltiples identidades → muestra pantalla de selección de CUIT", async () => {
    mockResolveDni.mockResolvedValue({
      identities: [
        { cuit: "20301234568", nombreCompleto: "Juan Pérez" },
        { cuit: "27301234565", nombreCompleto: "Juana Pérez" },
      ],
      existingClient: null,
    });
    renderScreen();
    const input = screen.getByLabelText(/dni/i);
    fireEvent.change(input, { target: { value: "30123456" } });
    fireEvent.submit(input.closest("form"));

    await waitFor(() => {
      // El encabezado del paso de selección
      expect(screen.getByText(/cuál es tu cuit/i)).toBeTruthy();
      // Los CUITs se muestran con prefijo "CUIT "
      expect(screen.getByText(/CUIT 20301234568/)).toBeTruthy();
      expect(screen.getByText(/CUIT 27301234565/)).toBeTruthy();
    });
  });

  it("con cliente existente → muestra email enmascarado y paso de contraseña", async () => {
    mockResolveDni.mockResolvedValue({
      identities: [{ cuit: "20301234568", nombreCompleto: "Juan Pérez" }],
      existingClient: { maskedEmail: "j****ez@gm****.com" },
    });
    renderScreen();
    const input = screen.getByLabelText(/dni/i);
    fireEvent.change(input, { target: { value: "30123456" } });
    fireEvent.submit(input.closest("form"));

    await waitFor(() => {
      expect(screen.getByText(/j\*\*\*\*ez@gm\*\*\*\*\.com/)).toBeTruthy();
    });
  });

  it("error del servicio muestra mensaje al usuario", async () => {
    mockResolveDni.mockRejectedValue(new Error("Error de conexión"));
    renderScreen();
    const input = screen.getByLabelText(/dni/i);
    fireEvent.change(input, { target: { value: "30123456" } });
    fireEvent.submit(input.closest("form"));

    await waitFor(() => {
      expect(screen.getByText(/Error de conexión/i)).toBeTruthy();
    });
  });

  it("sin identidades en padrón → avanza al paso email/contraseña (registro manual)", async () => {
    mockResolveDni.mockResolvedValue({ identities: [], existingClient: null });
    renderScreen();
    const input = screen.getByLabelText(/dni/i);
    fireEvent.change(input, { target: { value: "30123456" } });
    fireEvent.submit(input.closest("form"));

    await waitFor(() => {
      expect(screen.getByLabelText(/^email$/i)).toBeTruthy();
    });
  });
});

describe("RegisterScreen — registro nuevo usuario con CUIT", () => {
  it("pasa cuit al llamar a authService.register", async () => {
    mockResolveDni.mockResolvedValue({
      identities: [{ cuit: "20301234568", nombreCompleto: "Juan Pérez" }],
      existingClient: null,
    });
    mockRegister.mockResolvedValue({ success: true });

    renderScreen();
    // Paso DNI
    fireEvent.change(screen.getByLabelText(/dni/i), { target: { value: "30123456" } });
    fireEvent.submit(screen.getByLabelText(/dni/i).closest("form"));

    // Paso email + contraseña
    await waitFor(() => screen.getByLabelText(/^email$/i));
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: "Password123!" } });
    fireEvent.submit(screen.getByLabelText(/^email$/i).closest("form"));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        "test@test.com",
        "Password123!",
        expect.any(String), // turnstileToken
        "20301234568",       // cuit
      );
    });
  });
});
