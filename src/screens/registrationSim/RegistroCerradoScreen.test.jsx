// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

vi.mock("./OnboardingFlowScreen.jsx", () => ({
  default: () => <h1>Flujo de registro</h1>,
}));

vi.mock("../DNIUploadMobile/DNIUploadMobileScreen.jsx", () => ({
  default: () => <h1>Captura de DNI por QR</h1>,
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
  vi.stubEnv("VITE_REGISTRO_WEB_HABILITADO", undefined);
});

afterEach(() => vi.unstubAllEnvs());

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

  it("mantiene el registro cerrado cuando la variable vale false", async () => {
    vi.stubEnv("VITE_REGISTRO_WEB_HABILITADO", "false");
    renderAt("/subir-dni");
    expect(await screen.findByRole("heading", { name: "Pedí tu préstamo por el chat" })).toBeVisible();
  });
});

describe("registro web habilitado", () => {
  it.each([
    ["/registro-simulador", "Flujo de registro"],
    ["/registro-simulador?id=link-operador", "Flujo de registro"],
    ["/subir-dni?leadId=1&token=t", "Captura de DNI por QR"],
  ])("%s muestra la pantalla correspondiente", async (url, heading) => {
    vi.stubEnv("VITE_REGISTRO_WEB_HABILITADO", "true");
    renderAt(url);
    expect(await screen.findByRole("heading", { name: heading })).toBeVisible();
  });
});
