/**
 * Tab Mis préstamos: vacío elegante cuando no hay historial en SB,
 * y tarjetas cuando sí hay préstamos.
 */

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../../Components/index.js", () => ({
  Header: () => <div data-testid="header-stub" />,
  Footer: () => <div data-testid="footer-stub" />,
}));

vi.mock("../../../services/authService.js", () => ({
  default: {
    getPrestamos: vi.fn(),
  },
}));

import authService from "../../../services/authService.js";
import MisPrestamosScreen from "../MisPrestamosScreen.jsx";

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={["/mi-perfil/prestamos"]}>
      <MisPrestamosScreen />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MisPrestamosScreen", () => {
  it("muestra un mensaje elegante si no hay préstamos", async () => {
    authService.getPrestamos.mockResolvedValue({
      esCliente: false,
      prestamos: [],
    });
    renderScreen();

    expect(
      await screen.findByRole("heading", {
        name: /no tenés préstamos en tu historial/i,
      }),
    ).toBeTruthy();
    expect(screen.getByText(/vigentes, finalizados y cancelados/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: /quiero mi préstamo/i }).getAttribute("href")).toBe(
      "/registro-simulador",
    );
    expect(screen.getByRole("navigation", { name: /secciones de tu cuenta/i })).toBeTruthy();
  });

  it("lista préstamos de SB con estado", async () => {
    authService.getPrestamos.mockResolvedValue({
      esCliente: true,
      prestamos: [
        { id: 20, estado: "Vigente", capital: 150000, cuota: null, plazo: 12, fecha: null },
        { id: 10, estado: "Cancelado", capital: null, cuota: null, plazo: null, fecha: null },
      ],
    });
    renderScreen();

    expect(await screen.findByText(/préstamo #20/i)).toBeTruthy();
    expect(screen.getByText(/préstamo #10/i)).toBeTruthy();
    expect(screen.getByText("Vigente")).toBeTruthy();
    expect(screen.getByText("Cancelado")).toBeTruthy();
    expect(screen.queryByText(/no tenés préstamos en tu historial/i)).toBeNull();
  });

  it("muestra valor de cuota, plazo y próximo vencimiento", async () => {
    authService.getPrestamos.mockResolvedValue({
      esCliente: true,
      prestamos: [
        {
          id: 15840,
          estado: "Pendiente",
          capital: 210000,
          cuota: 38500,
          plazo: 6,
          proximoVto: "2027-05-01",
          fecha: "2026-03-01",
          linea: "Personal",
        },
      ],
    });
    renderScreen();

    expect(await screen.findByText(/préstamo #15840/i)).toBeTruthy();
    expect(screen.getByText(/personal/i)).toBeTruthy();
    expect(screen.getByText("Valor cuota")).toBeTruthy();
    expect(screen.getByText("6 cuotas")).toBeTruthy();
    expect(screen.getByText("Próximo vencimiento")).toBeTruthy();
    expect(screen.queryByText("Saldo")).toBeNull();
    expect(screen.queryByText("1 de 6 cuotas")).toBeNull();
  });
});
