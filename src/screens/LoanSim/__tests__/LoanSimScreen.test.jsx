// @vitest-environment jsdom
// Task 0.8: smoke test de la integración del TestSimuladorPanel en LoanSimScreen.
// El Screen debe montar el panel cuando useTestSimuladorPanel expone personas
// no-vacías. Antes del wiring, este test FALLA porque LoanSimScreen no importa
// useTestSimuladorPanel ni TestSimuladorPanel.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

// El módulo se mockea completo, así que hay que reexportar también
// `PERSONAS_CON_APROBAR_CBU`: el panel lo importa para decidir qué botón
// renderizar. `useTestSimuladorPanel` es un `vi.fn()` para que un test
// pueda sobreescribir su retorno con `mockReturnValueOnce`.
vi.mock("../hooks/useTestSimuladorPanel.js", () => ({
  useTestSimuladorPanel: vi.fn(() => ({
    personas: [
      { id: "SIM_HAPPY", label: "Hugo", descripcion: "Happy" },
    ],
    loading: false,
    error: null,
    selectPersona: vi.fn(),
    resetSession: vi.fn(),
    aprobarCbu: vi.fn(),
    approvingCbu: null,
    cbuAprobadoPara: null,
  })),
  PERSONAS_CON_APROBAR_CBU: new Set(["SIM_CBU_PENDING"]),
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

// El mock del GenericButton reenvía las props al <button> para que los
// tests puedan engancharse al `data-testid` y al `onClick` (el panel marca
// el botón de approve con `data-testid='test-simulador-panel-aprobar-cbu'`).
vi.mock("../../../Components/buttons/GenericButton/GenericButton.jsx", () => ({
  default: ({ children, variant, className, loading, ...props }) => (
    <button {...props} className={className}>
      {loading ? null : children}
    </button>
  ),
}));

import { useTestSimuladorPanel } from "../hooks/useTestSimuladorPanel.js";
import LoanSimScreen from "../LoanSimScreen.jsx";

const renderScreen = (search = "/loan-sim?testMode=1") =>
  render(
    <MemoryRouter initialEntries={[search]}>
      <LoanSimScreen />
    </MemoryRouter>,
  );

// `isTestPersonasVisible()` (src/config.js) lee `window.location.search` — y
// `MemoryRouter` NO cambia `window.location` (su `initialEntries` sólo
// afecta al router). Sin este pushState el panel devuelve null y el test
// falla. Mismo patrón que el panel y el hook: el query param `testMode=1`
// es la única vía runtime-testeable de abrir el gate en Vitest.
const setUrl = (url) => {
  window.history.pushState({}, "", url);
};

describe("LoanSimScreen — TestSimuladorPanel integration (Task 0.8)", () => {
  beforeEach(() => {
    setUrl("/loan-sim?testMode=1");
  });

  afterEach(() => {
    setUrl("/loan-sim");
  });

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

  // Plan 2026-10-21: el approve del CBU se cablea en el Screen. Este test
  // cubre el WIRING (que la prop llegue al panel con el nombre correcto):
  // sin él, un typo en el nombre de la prop dejaría un botón muerto con
  // todos los tests del panel en verde.
  it("el botón 'Validar CBU' del panel dispara el approve del hook", () => {
    const aprobarCbu = vi.fn();
    vi.mocked(useTestSimuladorPanel).mockReturnValueOnce({
      personas: [{ id: "SIM_CBU_PENDING", label: "Laura — CBU pendiente" }],
      loading: false,
      error: null,
      selectPersona: vi.fn(),
      resetSession: vi.fn(),
      aprobarCbu,
      approvingCbu: null,
      cbuAprobadoPara: null,
    });

    renderScreen();

    fireEvent.click(screen.getByTestId("test-simulador-panel-aprobar-cbu"));
    expect(aprobarCbu).toHaveBeenCalledTimes(1);
    expect(aprobarCbu).toHaveBeenCalledWith("SIM_CBU_PENDING");
  });
});