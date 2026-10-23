// @vitest-environment jsdom
// 2026-09-11 — flash-of-step fix: prueba el contrato end-to-end del gate
// de primera paint en OnboardingFlowScreen. Mientras `isInitializing`
// (restoringOnboarding || resumeLoading) sea true, ningún step component
// debe estar montado — sólo el loader. Ver useOnboardingFlow.js:55
// (initial restoringOnboarding=true) y OnboardingFlowScreen.jsx (early
// return con Loader full-screen).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// vi.mock es hoisted — declarar ANTES del import del Screen.

// Services
vi.mock("../../services/linkResolutionService.js", () => ({
  __esModule: true,
  default: { consumeLink: vi.fn() },
}));

vi.mock("../../services/leadRegistrationService.js", () => ({
  __esModule: true,
  default: {
    obtenerEstadoOnboarding: vi.fn().mockResolvedValue({ success: false }),
    iniciarSesionResume: vi.fn().mockResolvedValue({ success: false }),
    actualizarEstadoOnboarding: vi.fn().mockResolvedValue({ success: true }),
    crearLead: vi.fn().mockResolvedValue({ success: false }),
    solicitarOTPCelular: vi.fn().mockResolvedValue({ success: false }),
    verificarOTPCelular: vi.fn().mockResolvedValue({ success: false }),
    phonePickerPick: vi.fn().mockResolvedValue({ success: false }),
    onBoardingCompleto: vi.fn().mockResolvedValue({ success: false }),
  },
}));

// Lib utilities
vi.mock("../../lib/utils.js", () => ({
  getCookie: vi.fn().mockResolvedValue(null),
  setCookie: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../lib/token.js", () => ({
  getDecodedToken: vi.fn().mockReturnValue(null),
}));

// Callbell helper — evita tocar document.body.classList en jsdom
vi.mock("../../utils/callbellHelpers.js", () => ({
  toggleCallbellWebchat: vi.fn(),
  openCallbellWebchat: vi.fn(),
}));

// Hooks auxiliares del Screen
vi.mock("./hooks/usePhoneOTP.js", () => ({
  usePhoneOTP: () => ({
    verificarOTP: vi.fn(),
    reenviarOTP: vi.fn(),
    validating: false,
    error: null,
  }),
}));

vi.mock("./hooks/usePhonePicker.js", () => ({
  usePhonePicker: () => ({
    submitPick: vi.fn(),
    submitting: false,
    error: null,
  }),
}));

// Componentes de layout — el Header real requiere ScrollContext y
// useLocation; el Footer probablemente también. Stubs vacíos.
vi.mock("../../Components/index.js", () => ({
  Header: () => <div data-testid="mock-header" />,
  Footer: () => <div data-testid="mock-footer" />,
  // Otros exports que el barrel re-exporta pero el Screen no usa:
  HeaderPoints: () => null,
  AnimatedTitle: () => null,
  ContactForm: () => null,
  OurServicesList: () => null,
  PersonalLendForm: () => null,
  HeaderType2: () => null,
  HeaderElMejorTrato: () => null,
  HeaderAssist: () => null,
  AssistSlider: () => null,
  WorkWithUsForm: () => null,
  Carrusel: () => null,
  FrecuentQuestion: () => null,
  FraudWarning: () => null,
  CanalesOficialesWarning: () => null,
}));

vi.mock("../../Components/Loader/Loader.jsx", () => ({
  default: () => <div data-testid="mock-loader" />,
}));

vi.mock("../../Sections/index.js", () => ({
  HeroLoanSim: () => <div data-testid="mock-hero-loan-sim" />,
}));

vi.mock("../../Components/buttons/backbutton/BackButton.jsx", () => ({
  default: () => <div data-testid="mock-back-button" />,
}));

vi.mock("../../Components/OTPValidation/OTPValidation.jsx", () => ({
  default: () => <div data-testid="mock-otp-validation" />,
}));

// Step components con data-testid — el corazón del test.
vi.mock("./components/LeadRegistrationStep/LeadRegistrationStep.jsx", () => ({
  default: () => <div data-testid="lead-registration-step" />,
}));
vi.mock("./components/ReciboUploadStep/ReciboUploadStep.jsx", () => ({
  default: () => <div data-testid="recibo-upload-step" />,
}));
vi.mock("./components/WelcomeStep/WelcomeStep.jsx", () => ({
  default: () => <div data-testid="welcome-step" />,
}));
vi.mock("./components/DNIUploadStep/DNIUploadStep.jsx", () => ({
  default: () => <div data-testid="dni-upload-step" />,
}));
vi.mock("./components/AnalysisStep/AnalysisStep.jsx", () => ({
  default: () => <div data-testid="analysis-step" />,
}));
vi.mock("./components/RejectedStep/RejectedStep.jsx", () => ({
  default: () => <div data-testid="rejected-step" />,
}));
vi.mock("./components/IdentitySelectionStep/IdentitySelectionStep.jsx", () => ({
  default: () => <div data-testid="identity-selection-step" />,
}));

import OnboardingFlowScreen from "./OnboardingFlowScreen.jsx";

beforeEach(async () => {
  vi.clearAllMocks();
  const { getCookie } = await import("../../lib/utils.js");
  const { getDecodedToken } = await import("../../lib/token.js");
  const service = (await import("../../services/leadRegistrationService.js")).default;
  getCookie.mockReset().mockResolvedValue(null);
  getDecodedToken.mockReset().mockReturnValue(null);
  service.obtenerEstadoOnboarding.mockReset().mockResolvedValue({ success: false });
});

const renderScreen = (search = "/") =>
  render(
    <MemoryRouter initialEntries={[search]}>
      <OnboardingFlowScreen />
    </MemoryRouter>,
  );

describe("OnboardingFlowScreen — manual advisor status check", () => {
  const pendingState = {
    success: true,
    data: { estado_onboarding: "EMAIL_PENDING_ADVISOR", requiresAdvisorContact: true, es_cliente: true },
  };
  let service;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { getCookie } = await import("../../lib/utils.js");
    const { getDecodedToken } = await import("../../lib/token.js");
    service = (await import("../../services/leadRegistrationService.js")).default;
    getCookie.mockResolvedValue("advisor-token");
    getDecodedToken.mockReturnValue({ leadId: 42 });
    service.obtenerEstadoOnboarding.mockResolvedValue({ success: false });
    service.obtenerEstadoOnboarding.mockResolvedValueOnce(pendingState);
  });

  it("keeps the advisor card visible while checking, then passes all four picker options", async () => {
    let resolveCheck;
    service.obtenerEstadoOnboarding.mockImplementationOnce(() => new Promise(resolve => { resolveCheck = resolve; }));
    renderScreen();
    const verifyButton = await screen.findByRole("button", { name: "Verificar estado" });
    fireEvent.click(verifyButton);
    await waitFor(() => expect(verifyButton).toHaveAttribute("aria-busy", "true"));
    expect(verifyButton).toBeDisabled();
    expect(screen.getByRole("button", { name: "Hablar con un asesor" })).toBeEnabled();
    expect(screen.getByRole("heading", { name: "Hablá con un asesor para continuar" })).toBeVisible();
    expect(screen.queryByText("Preparando tu onboarding...")).toBeNull();
    await act(async () => resolveCheck({ success: true, data: {
      estado_onboarding: "PHONE_PICKER",
      pickerContext: { options: ["1111111111", "2222222222", "3333333333", "0111111111"], target: "1111111111" },
    } }));
    expect(await screen.findByText("1111111111")).toBeVisible();
    expect(screen.getByText("2222222222")).toBeVisible();
    expect(screen.getByText("3333333333")).toBeVisible();
    expect(screen.getByText("0111111111")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Verificar estado" })).toBeNull();
  });

  it("shows a local pending message and permits another check", async () => {
    service.obtenerEstadoOnboarding.mockResolvedValueOnce(pendingState);
    renderScreen();
    fireEvent.click(await screen.findByRole("button", { name: "Verificar estado" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Tu correo todavía está pendiente de actualización");
    expect(screen.getByRole("button", { name: "Verificar estado" })).toBeEnabled();
    expect(screen.queryByText("Preparando tu onboarding...")).toBeNull();
  });

  it("shows a local error and clears it when retrying successfully", async () => {
    service.obtenerEstadoOnboarding.mockRejectedValueOnce(new Error("No pudimos consultar. Volvé a intentarlo."));
    service.obtenerEstadoOnboarding.mockResolvedValueOnce(pendingState);
    renderScreen();
    fireEvent.click(await screen.findByRole("button", { name: "Verificar estado" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos consultar. Volvé a intentarlo.");
    expect(screen.queryByText("No pudimos recuperar tu solicitud")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Verificar estado" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Tu correo todavía está pendiente de actualización");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("button", { name: "Verificar estado" })).toBeEnabled();
  });

  it("retains the advisor card and enables retry after an incomplete picker response", async () => {
    service.obtenerEstadoOnboarding.mockResolvedValueOnce({
      success: true,
      message: "Selector incompleto",
      data: { estado_onboarding: "PHONE_PICKER", pickerContext: null, requiresAdvisorContact: false },
    }).mockResolvedValueOnce(pendingState);
    renderScreen();
    fireEvent.click(await screen.findByRole("button", { name: "Verificar estado" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Selector incompleto");
    expect(screen.getByRole("button", { name: "Hablar con un asesor" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Verificar estado" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Verificar estado" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Tu correo");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(service.obtenerEstadoOnboarding).toHaveBeenCalledTimes(3);
  });

  it("keeps the advisor action opening Callbell", async () => {
    const { openCallbellWebchat } = await import("../../utils/callbellHelpers.js");
    renderScreen();
    fireEvent.click(await screen.findByRole("button", { name: "Hablar con un asesor" }));
    expect(openCallbellWebchat).toHaveBeenCalledExactlyOnceWith();
  });
});

it("offers manual recovery after ERP failure and restores the picker", async () => {
  const { getCookie } = await import("../../lib/utils.js");
  const { getDecodedToken } = await import("../../lib/token.js");
  const service = (await import("../../services/leadRegistrationService.js")).default;
  getCookie.mockResolvedValue("existing-token");
  getDecodedToken.mockReturnValue({ leadId: 42 });
  service.obtenerEstadoOnboarding.mockRejectedValueOnce(new Error("ERP unavailable"));
  renderScreen();
  expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos recuperar tu solicitud");
  expect(screen.queryByTestId("lead-registration-step")).toBeNull();
  let complete;
  service.obtenerEstadoOnboarding.mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
  fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  await waitFor(() => expect(complete).toBeTypeOf("function"));
  expect(screen.getByRole("status")).toHaveTextContent("Preparando tu onboarding");
  expect(screen.queryByRole("button", { name: "Reintentar" })).toBeNull();
  await act(async () => { complete({ success: true, data: { estado_onboarding: "PHONE_PICKER", pickerContext: { options: ["1111111111", "2222222222", "3333333333", "0111111111"], target: "1111111111" } } }); });
  expect(await screen.findByRole("button", { name: "Opción 1: 1111111111" })).toBeVisible();
  expect(screen.queryByRole("alert")).toBeNull();
});

describe("OnboardingFlowScreen — flash-of-step gate (flash fix 2026-09-11)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("primera paint con cookie válido pendiente: NO monta ningún step; loader visible", async () => {
    // Cookie presente + leadId válido → el effect llama a
    // obtenerEstadoOnboarding. La restore está en vuelo durante la
    // primera paint, así que el gate debe estar cerrado.
    const { getCookie } = await import("../../lib/utils.js");
    const { getDecodedToken } = await import("../../lib/token.js");
    getCookie.mockResolvedValue("jwt-with-leadId");
    getDecodedToken.mockReturnValue({ leadId: 42 });

    renderScreen("/");

    // En la primera paint (síncrona), ningún step debe estar montado.
    expect(screen.queryByTestId("lead-registration-step")).toBeNull();
    expect(screen.queryByTestId("recibo-upload-step")).toBeNull();
    expect(screen.queryByTestId("dni-upload-step")).toBeNull();
    expect(screen.queryByTestId("welcome-step")).toBeNull();

    // El loader SÍ debe estar visible (early return del gate).
    expect(screen.queryByTestId("mock-loader")).not.toBeNull();

    // Después de que el effect resuelva, sí debe montar el step correcto.
    // mock default de obtenerEstadoOnboarding es { success: false }, lo que
    // deja onboardingStep en LEAD_REGISTRATION (default) → renderiza
    // LeadRegistrationStep.
    await waitFor(() => {
      expect(screen.queryByTestId("lead-registration-step")).not.toBeNull();
    });
  });

  it("primera paint con ?id=peor: NO monta ningún step mientras consumeLink está pendiente", async () => {
    const LinkResolutionService = (
      await import("../../services/linkResolutionService.js")
    ).default;

    // Simular consumeLink que tarda: el Promise queda pending hasta que
    // llamemos resolveConsume() desde dentro del test. Durante esa ventana
    // el resumeLoading del Screen debe seguir true → gate cerrado.
    let resolveConsume;
    LinkResolutionService.consumeLink.mockReturnValueOnce(
      new Promise((res) => {
        resolveConsume = res;
      }),
    );

    renderScreen("/?id=peor");

    // En la primera paint, ningún step está montado (loader full-screen).
    expect(screen.queryByTestId("lead-registration-step")).toBeNull();
    expect(screen.queryByTestId("recibo-upload-step")).toBeNull();
    expect(screen.queryByTestId("mock-loader")).not.toBeNull();

    // Resolver consumeLink con un leadId y dejar que la Promise del resume
    // complete sin éxito (default mock → success: false). El finally del
    // resume useEffect baja resumeLoading, gate se abre y renderiza
    // LEAD_REGISTRATION (porque el resume falló → step queda en default).
    resolveConsume({ success: true, data: { leadId: 99 } });

    await waitFor(() => {
      expect(screen.queryByTestId("lead-registration-step")).not.toBeNull();
    });
  });

  it("primera paint sin cookie y sin ?id=: loader primero, luego LEAD_REGISTRATION", async () => {
    // Defaults: getCookie → null, getDecodedToken → null. La restore cae
    // en early return (línea 80) y baja el flag. Pero la primera paint
    // ocurre con restoringOnboarding=true (initial flipped), así que el
    // gate debe estar cerrado hasta ese early return.
    renderScreen("/");

    // En la primera paint, ningún step está montado (loader full-screen).
    expect(screen.queryByTestId("lead-registration-step")).toBeNull();
    expect(screen.queryByTestId("mock-loader")).not.toBeNull();

    // Después del effect (que termina con early return → setRestoringOnboarding(false)),
    // el LEAD_REGISTRATION step aparece.
    await waitFor(() => {
      expect(screen.queryByTestId("lead-registration-step")).not.toBeNull();
    });
  });
});
