// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../services/linkResolutionService.js", () => ({
  __esModule: true,
  default: { consumeLink: vi.fn() },
}));

vi.mock("../../services/leadRegistrationService.js", () => ({
  __esModule: true,
  default: {
    obtenerEstadoOnboarding: vi.fn(),
    iniciarSesionResume: vi.fn(),
    crearLead: vi.fn(),
  },
}));

vi.mock("../../utils/callbellHelpers", () => ({
  openCallbellWebchat: vi.fn(),
  toggleCallbellWebchat: vi.fn(),
}));

vi.mock("../../Components/index.js", () => ({
  Header: () => <div data-testid="mock-header" />,
  Footer: () => <div data-testid="mock-footer" />,
}));

vi.mock("../../Sections/index.js", () => ({
  HeroLoanSim: () => <div data-testid="mock-hero-loan-sim" />,
}));

import RouterScreens from "../../RouterScreens.jsx";
import LinkResolutionService from "../../services/linkResolutionService.js";
import LeadRegistrationService from "../../services/leadRegistrationService.js";
import { openCallbellWebchat } from "../../utils/callbellHelpers";

const renderAt = (url) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <RouterScreens />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
});

describe("registro web cerrado", () => {
  it.each(["/registro-simulador", "/registro-simulador?id=link-operador", "/subir-dni?leadId=1&token=t"])(
    "%s muestra el webchat sin iniciar ni retomar el onboarding",
    async (url) => {
      renderAt(url);
      expect(await screen.findByRole("heading", { name: "Pedí tu préstamo por el chat" })).toBeVisible();
      expect(LinkResolutionService.consumeLink).not.toHaveBeenCalled();
      expect(LeadRegistrationService.obtenerEstadoOnboarding).not.toHaveBeenCalled();
      expect(LeadRegistrationService.iniciarSesionResume).not.toHaveBeenCalled();
    },
  );

  it("el botón abre el webchat", async () => {
    renderAt("/registro-simulador");
    fireEvent.click(await screen.findByRole("button", { name: "Hablar con un asesor" }));
    expect(openCallbellWebchat).toHaveBeenCalledExactlyOnceWith();
  });
});
