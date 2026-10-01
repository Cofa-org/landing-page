/**
 * Tests del botón "Retomar solicitud" en MisSolicitudesScreen.
 * Verifica que:
 * - El botón aparece solo para solicitudes incompletas
 * - No aparece para otros estados (aprobada, en análisis, etc.)
 * - Al hacer click llama a authService.resumeSolicitud
 * - Un error de backend se muestra al usuario
 */

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../../Components/index.js", () => ({
  Header: () => <div data-testid="header-stub" />,
  Footer: () => <div data-testid="footer-stub" />,
}));

vi.mock("../../../lib/utils.js", () => ({
  setCookieWithDuration: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../../constants/LOAN_SIM.js", () => ({
  COOKIE_LEAD_TOKEN_CONFIG: { NAME: "leadToken", EXPIRY_MS: 7200000 },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockResumeSolicitud = vi.fn();
vi.mock("../../../services/authService.js", () => ({
  default: {
    getSolicitudes: vi.fn(),
    resumeSolicitud: (...args) => mockResumeSolicitud(...args),
  },
}));

import authService from "../../../services/authService.js";
import MisSolicitudesScreen from "../MisSolicitudesScreen.jsx";

/* ── Factory de solicitudes de prueba ─────────────────────────────── */
const make = (overrides = {}) => ({
  id: 1,
  estadoOnboarding: null,
  estadoOnboardingFecha: null,
  estadoGestion: null,
  fechaEstadoGestion: null,
  estadoScoring: null,
  prestamo: null,
  fechaSolicitud: "2026-08-01T00:00:00.000Z",
  ...overrides,
});

function renderScreen() {
  return render(
    <MemoryRouter>
      <MisSolicitudesScreen />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("MisSolicitudesScreen — botón Retomar", () => {
  it("muestra el botón Retomar para solicitud incompleta (estado vacío)", async () => {
    authService.getSolicitudes.mockResolvedValue({ solicitudes: [make()] });
    renderScreen();
    const btn = await screen.findByRole("button", { name: /retomar solicitud/i });
    expect(btn).toBeTruthy();
  });

  it("muestra el botón Retomar cuando estado_onboarding = LEAD_CREADO", async () => {
    authService.getSolicitudes.mockResolvedValue({
      solicitudes: [make({ estadoOnboarding: "LEAD_CREADO" })],
    });
    renderScreen();
    expect(await screen.findByRole("button", { name: /retomar solicitud/i })).toBeTruthy();
  });

  it("muestra el botón Retomar cuando estado_onboarding = DNI_SUBIDO", async () => {
    authService.getSolicitudes.mockResolvedValue({
      solicitudes: [make({ estadoOnboarding: "DNI_SUBIDO" })],
    });
    renderScreen();
    expect(await screen.findByRole("button", { name: /retomar solicitud/i })).toBeTruthy();
  });

  it("NO muestra el botón Retomar para solicitud aprobada", async () => {
    authService.getSolicitudes.mockResolvedValue({
      solicitudes: [make({ estadoGestion: "ACEPTADO" })],
    });
    renderScreen();
    await screen.findByText("Aprobada");
    expect(screen.queryByRole("button", { name: /retomar solicitud/i })).toBeNull();
  });

  it("NO muestra el botón Retomar para solicitud en análisis", async () => {
    authService.getSolicitudes.mockResolvedValue({
      solicitudes: [make({ estadoGestion: "ANALIZAR" })],
    });
    renderScreen();
    await screen.findByText("En análisis");
    expect(screen.queryByRole("button", { name: /retomar solicitud/i })).toBeNull();
  });

  it("NO muestra el botón Retomar para solicitud rechazada (No aprobada)", async () => {
    authService.getSolicitudes.mockResolvedValue({
      solicitudes: [make({ estadoOnboarding: "RECHAZADO", estadoOnboardingFecha: "2026-07-01T00:00:00.000Z" })],
    });
    renderScreen();
    await screen.findByText("No aprobada");
    expect(screen.queryByRole("button", { name: /retomar solicitud/i })).toBeNull();
  });

  it("NO muestra el botón Retomar para solicitud finalizada (con préstamo SB)", async () => {
    authService.getSolicitudes.mockResolvedValue({
      solicitudes: [make({ prestamo: { idPrestamoDB: "SB-001", capitalSeleccionado: 50000 } })],
    });
    renderScreen();
    await screen.findByText("Solicitud finalizada");
    expect(screen.queryByRole("button", { name: /retomar solicitud/i })).toBeNull();
  });

  it("click en Retomar llama resumeSolicitud y abre /registro-simulador en pestaña nueva", async () => {
    authService.getSolicitudes.mockResolvedValue({ solicitudes: [make()] });
    mockResumeSolicitud.mockResolvedValue({ data: { leadToken: "tok-abc" } });
    const newTab = { closed: false, location: { href: "" }, close: vi.fn() };
    vi.spyOn(window, "open").mockReturnValue(newTab);

    renderScreen();
    const btn = await screen.findByRole("button", { name: /retomar solicitud/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(mockResumeSolicitud).toHaveBeenCalledTimes(1);
      expect(window.open).toHaveBeenCalledWith("about:blank", "_blank");
      expect(newTab.location.href).toBe("/registro-simulador");
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("si el popup está bloqueado, navega en la misma pestaña", async () => {
    authService.getSolicitudes.mockResolvedValue({ solicitudes: [make()] });
    mockResumeSolicitud.mockResolvedValue({ data: { leadToken: "tok-abc" } });
    vi.spyOn(window, "open").mockReturnValue(null);

    renderScreen();
    const btn = await screen.findByRole("button", { name: /retomar solicitud/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/registro-simulador");
    });
  });

  it("muestra error si resumeSolicitud falla", async () => {
    authService.getSolicitudes.mockResolvedValue({ solicitudes: [make()] });
    mockResumeSolicitud.mockRejectedValue(new Error("No podemos retomar"));
    const newTab = { closed: false, location: { href: "" }, close: vi.fn() };
    vi.spyOn(window, "open").mockReturnValue(newTab);

    renderScreen();
    const btn = await screen.findByRole("button", { name: /retomar solicitud/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText(/No podemos retomar/i)).toBeTruthy();
    });
    expect(newTab.close).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
