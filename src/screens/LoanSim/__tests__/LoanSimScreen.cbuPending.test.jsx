// @vitest-environment jsdom
// Plan 2026-10-20 (gate de validación manual de CBU): el screen debe
// renderizar la pantalla de espera cuando el back devuelve la simulación
// en PENDING_CBU_VALIDATION, NO debe ofrecer el botón "atrás" (el paso es un
// dead-end hasta que el asesor actúe), y debe mapear la cuenta que ingressó
// el cliente a la columna correcta (`cbu_usuario` / `cvu_usuario`).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Estado del mock de `useLoanSimulator`. Tiene que ser `vi.hoisted` porque la
// factory de `vi.mock` se ejecuta antes de que el módulo del test termine de
// evaluarse (y `beforeEach` corre en tiempo de test, cuando la constante ya
// está inicializada).
const mockState = vi.hoisted(() => ({
  step: "",
  simulationData: null,
  rejectionReason: null,
  loading: false,
  validating: false,
  error: null,
}));

// Mocks: declarar ANTES de importar el Screen bajo test.
// Rutas con 3 niveles ".." porque el test vive en src/screens/LoanSim/__tests__/.
vi.mock("../../../utils/callbellHelpers.js", () => ({
  toggleCallbellWebchat: vi.fn(),
  // `usePendingCbuValidation` (Task 9) lee `openCallbellWebchat` de este
  // módulo. Si el mock no lo expone, Vitest tira "No export is defined on the
  // mock" en cuanto un test clickee "Comunicarse con un asesor".
  openCallbellWebchat: vi.fn(),
}));

vi.mock("../hooks/useLoanSimulator.js", () => ({
  useLoanSimulator: () => ({
    amount: 100000,
    installment: 12,
    simulationData: mockState.simulationData,
    loading: mockState.loading,
    validating: mockState.validating,
    error: mockState.error,
    nombreCompleto: "",
    scoringId: null,
    step: mockState.step,
    email: "",
    cuit: "",
    loanInfo: null,
    loadingModal: false,
    bancoEncontrado: null,
    codigoBancoError: null,
    validandoBanco: false,
    initialSimulationResolved: true,
    rejectionReason: mockState.rejectionReason,
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
    verificarEstadoCBU: vi.fn(),
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
    personas: [],
    activePersonaId: null,
    selectPersona: vi.fn(),
    resetSession: vi.fn(),
    collapsed: true,
    setCollapsed: vi.fn(),
  }),
}));

// Stubs de sub-componentes presentacionales: sin estos, el Header real se
// monta dentro del test y jsdom revienta (el Header usa useScrollContext() y
// jsdom no implementa IntersectionObserver).
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

// Mock **fiel** al `GenericButton` real: replica el `disabled={disabled || loading}`,
// el reemplazo de los children por un spinner cuando entra en `loading` y el
// reenvío del resto de las props (`aria-busy`, `aria-label`, `data-testid`).
// Sin ese reenvío no se puede assertar el estado "ocupado" del botón.
vi.mock("../../../Components/buttons/GenericButton/GenericButton.jsx", () => ({
  default: ({
    children,
    onClick,
    type = "button",
    variant = "primary",
    disabled = false,
    loading = false,
    className = "",
    ...props
  }) => (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={className || undefined}
      data-variant={variant}
      {...props}
    >
      {loading ? (
        <span aria-hidden="true" data-testid="mock-button-spinner" />
      ) : (
        children
      )}
    </button>
  ),
}));

// NO se mockea BackButton a propósito: el `BackButton` real renderiza
// `<button class="backButton">`, que matchea `button[class*='back']`. Con el
// mock del test existente (`<div data-testid="mock-back-button" />`) la
// aserción "no hay botón de atrás" quedaría vacía: no distinguiría "no se
// renderiza" de "se renderiza pero es un div".

// ⚠️ EL ORDEN IMPORTA: `LOAN_SIM_STEPS` tiene que importarse ANTES que el
// screen. El factory de `vi.mock` lo hoistea Vitest por encima de los imports y
// lo ejecuta cuando el screen importa el hook → si la constante no está
// inicializada, el factory la encuentra en TDZ y el test explota.
import { LOAN_SIM_STEPS } from "../../../constants/LOAN_SIM.js";
import LoanSimScreen from "../LoanSimScreen.jsx";

// Valores de las columnas del back para el caso "el cliente cambió su cuenta".
// Ninguno es prefijo del otro → un `getByText` exacto no puede confundirlos.
const CBU_USUARIO = "1111111111111111111111";
const CVU_USUARIO = "0002222222222222222222";

const renderScreen = () =>
  render(
    <MemoryRouter>
      <LoanSimScreen />
    </MemoryRouter>,
  );

beforeEach(() => {
  mockState.step = LOAN_SIM_STEPS.PENDING_CBU_VALIDATION;
  mockState.simulationData = null;
  mockState.rejectionReason = null;
  mockState.loading = false;
  mockState.validating = false;
  mockState.error = null;
});

describe("LoanSimScreen — step PENDING_CBU_VALIDATION (Plan 2026-10-20)", () => {
  it("renderiza la pantalla de espera cuando el step es PENDING_CBU_VALIDATION", async () => {
    renderScreen();
    // Async: `PendingCbuValidation` se registra con React.lazy → hasta que el
    // chunk resuelve, lo único en el DOM es el fallback del <Suspense>.
    expect(await screen.findByTestId("pending-cbu-validation")).toBeTruthy();
  });

  it("no renderiza el botón de volver atrás en el step de espera", () => {
    const { container } = renderScreen();
    expect(container.querySelector("button[class*='back']")).toBeNull();
  });

  it("el botón 'Verificar estado' queda ocupado y deshabilitado mientras refresca la simulación", async () => {
    // `verificarEstadoCBU` refresca la simulación y ese refresh setea `loading`
    // (no `validating`) → el spinner del botón tiene que salir de `loading`.
    mockState.loading = true;

    renderScreen();

    const button = await screen.findByTestId("pending-cbu-verificar-button");
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button).toBeDisabled();
    // Con `loading` el `GenericButton` real reemplaza los children por un
    // spinner → el nombre accesible viene del `aria-label`.
    expect(screen.getByTestId("mock-button-spinner")).toBeTruthy();
    expect(button).toHaveAttribute("aria-label", "Verificar estado");
  });

  // Fix final de rama: la pantalla de espera es un dead-end, así que un
  // refresh fallido (típicamente `SIMULADOR_SIMULATION_EXPIRED`, a las 24h)
  // tiene que ser visible. La superficie de error del screen
  // (`error && !simulationData && step === SIMULACION`) no puede dispararse
  // en este step → el error tiene que llegar por prop al componente.
  it("propaga el error del hook a la pantalla de espera", async () => {
    mockState.error = "Tu solicitud anterior expiró. Por favor, iniciala nuevamente 😊";

    renderScreen();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Tu solicitud anterior expiró");
  });
});

describe("LoanSimScreen — derivación de la cuenta validada por el asesor (Plan 2026-10-20)", () => {
  it("muestra el CBU del usuario (no el CVU) cuando ambas columnas están pobladas", async () => {
    // El back escribe SOLO la columna del accountType del submit y nunca limpia
    // la otra → un cliente que cambió de CBU a CVU deja AMBAS columnas
    // pobladas. El valor y el tipo tienen que derivar de la MISMA columna: si el
    // tipo saliera de `cvu_usuario`, el back escribiría un CBU en `cvu_usuario`.
    mockState.step = LOAN_SIM_STEPS.CBU_VALIDATION;
    mockState.simulationData = {
      existingSimulation: {
        id_cliente: 123,
        cbu: "0000000000000000000000",
        cbu_usuario: CBU_USUARIO,
        cvu_usuario: CVU_USUARIO,
        cbu_validado_por: "asesor",
      },
    };

    renderScreen();

    expect(await screen.findByTestId("cbu-validation-approved")).toBeTruthy();
    expect(screen.getByText("Validación de tu CBU")).toBeTruthy();
    expect(screen.getByText(CBU_USUARIO)).toBeTruthy();
    expect(screen.queryByText(CVU_USUARIO)).toBeNull();
  });

  it("muestra el CVU del usuario cuando sólo está poblada la columna cvu_usuario", async () => {
    mockState.step = LOAN_SIM_STEPS.CBU_VALIDATION;
    mockState.simulationData = {
      existingSimulation: {
        id_cliente: 123,
        cbu: "0000000000000000000000",
        cvu_usuario: CVU_USUARIO,
        cbu_validado_por: "asesor",
      },
    };

    renderScreen();

    expect(await screen.findByTestId("cbu-validation-approved")).toBeTruthy();
    expect(screen.getByText("Validación de tu CVU")).toBeTruthy();
    expect(screen.getByText(CVU_USUARIO)).toBeTruthy();
  });
});

describe("LoanSimScreen — rechazo por CBU (Plan 2026-10-20)", () => {
  it("muestra el mensaje de rechazo de CBU y no el de dispositivo diferente", async () => {
    mockState.step = LOAN_SIM_STEPS.RECHAZADO;
    mockState.rejectionReason = "CBU_REJECTED";

    renderScreen();

    // Async: `RejectedStep` se registra con React.lazy.
    expect(
      await screen.findByText("No pudimos validar tu cuenta bancaria"),
    ).toBeTruthy();
    expect(screen.queryByText("Dispositivo diferente detectado")).toBeNull();
  });
});
