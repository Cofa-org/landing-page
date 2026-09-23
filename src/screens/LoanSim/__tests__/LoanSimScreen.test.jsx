// @vitest-environment jsdom
// Task 0.8: smoke test de la integración del TestSimuladorPanel en LoanSimScreen.
// El Screen debe montar el panel cuando useTestSimuladorPanel expone personas
// no-vacías. Antes del wiring, este test FALLA porque LoanSimScreen no importa
// useTestSimuladorPanel ni TestSimuladorPanel.
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mocks: declarar ANTES de importar el Screen bajo test.
// Rutas con 3 niveles ".." porque el test vive en src/screens/LoanSim/__tests__/.
vi.mock("../../../utils/callbellHelpers.js", () => ({
  toggleCallbellWebchat: vi.fn(),
}));

vi.mock("../hooks/useLoanSimulator.js", () => ({
  useLoanSimulator: () => ({
    amount: 100000,
    installment: 12,
    simulationData: null,
    loading: false,
    validating: false,
    error: null,
    nombreCompleto: "",
    scoringId: null,
    step: "SIMULACION",
    email: "",
    cuit: "",
    loanInfo: null,
    loadingModal: false,
    bancoEncontrado: null,
    codigoBancoError: null,
    validandoBanco: false,
    initialSimulationResolved: true,
    rejectionReason: null,
    handleAmountChange: vi.fn(),
    handleInstallmentChange: vi.fn(),
    solicitarOTP: vi.fn(),
    verificarOTP: vi.fn(),
    validarCBU: vi.fn(),
    handleNextStep: vi.fn(),
    handlePrevStep: vi.fn(),
    handleMobbexSubscriptionCompleted: vi.fn(),
    handleInfoPrestamo: vi.fn(),
    guardarCompliance: vi.fn(),
    existingCompliance: null,
    verificarComplianceExistente: vi.fn(),
    setStep: vi.fn(),
  }),
}));

vi.mock("../hooks/useComplianceForm.js", () => ({
  useComplianceForm: () => ({
    formState: {},
    updateField: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock("../hooks/useTestSimuladorPanel.js", () => ({
  useTestSimuladorPanel: () => ({
    personas: [
      { id: "SIM_HAPPY", label: "Hugo", descripcion: "Happy" },
    ],
    loading: false,
    error: null,
    selectPersona: vi.fn(),
    resetSession: vi.fn(),
  }),
}));

// Sub-componentes presentacionales: stubs vacíos.
vi.mock("../../../Components/index.js", () => ({
  Header: () => <div data-testid="mock-header" />,
  Footer: () => <div data-testid="mock-footer" />,
}));

vi.mock("../../../Components/Loader/Loader.jsx", () => ({
  default: () => <div data-testid="mock-loader" />,
}));

vi.mock("../../../Sections/index.js", () => ({
  HeroLoanSim: () => <div data-testid="mock-hero-loan-sim" />,
}));

vi.mock("../../../Components/buttons/backbutton/BackButton.jsx", () => ({
  default: () => <div data-testid="mock-back-button" />,
}));

vi.mock("../../../Components/buttons/GenericButton/GenericButton.jsx", () => ({
  default: ({ children }) => <button>{children}</button>,
}));

import LoanSimScreen from "../LoanSimScreen.jsx";

const renderScreen = (search = "/loan-sim?testMode=1") =>
  render(
    <MemoryRouter initialEntries={[search]}>
      <LoanSimScreen />
    </MemoryRouter>,
  );

describe("LoanSimScreen — TestSimuladorPanel integration (Task 0.8)", () => {
  it("monta el TestSimuladorPanel cuando useTestSimuladorPanel expone personas no-vacías", () => {
    renderScreen();
    const panel = screen.queryByTestId("test-simulador-panel");
    expect(panel).not.toBeNull();
  });

  it("muestra un botón por cada persona devuelta por el hook", () => {
    renderScreen();
    const button = screen.getByRole("button", { name: /hugo/i });
    expect(button).toBeInTheDocument();
  });
});