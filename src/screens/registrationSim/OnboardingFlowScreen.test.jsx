// @vitest-environment jsdom
// 2026-09-11 — flash-of-step fix: prueba el contrato end-to-end del gate
// de primera paint en OnboardingFlowScreen. Mientras `isInitializing`
// (restoringOnboarding || resumeLoading) sea true, ningún step component
// debe estar montado — sólo el loader. Ver useOnboardingFlow.js:55
// (initial restoringOnboarding=true) y OnboardingFlowScreen.jsx (early
// return con Loader full-screen).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
vi.mock("./components/PhonePickerStep/PhonePickerStep.jsx", () => ({
  default: () => <div data-testid="phone-picker-step" />,
}));

import OnboardingFlowScreen from "./OnboardingFlowScreen.jsx";

const renderScreen = (search = "/") =>
  render(
    <MemoryRouter initialEntries={[search]}>
      <OnboardingFlowScreen />
    </MemoryRouter>,
  );

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