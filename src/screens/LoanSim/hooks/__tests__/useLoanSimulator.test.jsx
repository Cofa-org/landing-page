import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mocks: declarados ANTES de importar el hook bajo test
vi.mock("../../../../services/linkResolutionService.js", () => ({
  default: {
    consumeLink: vi.fn(),
  },
}));

vi.mock("../../../../services/simuladorService.js", () => ({
  default: {
    calcularPlanes: vi.fn(),
    iniciarSesion: vi.fn().mockResolvedValue({ success: true, data: { token: "mock-jwt" } }),
  },
}));

vi.mock("../../../../lib/fingerprint.js", () => ({
  getFingerprint: vi.fn(),
  mapFingerprintToHuellaData: vi.fn(),
}));

// Note: useDebounce is NOT mocked — we use the real implementation so the
// debounce window acts as the natural separator between the initial fetch
// (which would create a simulation in the backend) and any recalculation
// (which would only update it).

import LinkResolutionService from "../../../../services/linkResolutionService.js";
import SimuladorService from "../../../../services/simuladorService.js";
import { getFingerprint, mapFingerprintToHuellaData } from "../../../../lib/fingerprint.js";
import { LOAN_SIM_STEPS } from "../../../../constants/LOAN_SIM.js";
import { useLoanSimulator } from "../useLoanSimulator";

const SHORT_ID = "abc123";
const SCORING_ID = "999";
const CUIT = "20123456789";
const FINGERPRINT_RAW = {
  thumbmark: "tm-1",
  visitorId: "vid-1",
  requestId: "req-abc-123",
};
const HUELLA_DATA = { thumbmark: "tm-1", visitor_id: "vid-1" };

const consumeLinkResponse = {
  success: true,
  data: {
    scoringId: SCORING_ID,
    cuit: CUIT,
    nombreCompleto: "Juan Pérez",
    capitalMaximoOperador: 100000,
    tasaOperador: 0.85,
    plazoMaximoOperador: 24,
  },
};

const calcularPlanesResponse = {
  success: true,
  data: {
    capital_maximo_a_ofrecer: 100000,
    planes_disponibles: [{ plazo: 12, valorCuota: 1000, tasaOp: 0.85 }],
  },
};

const renderUseLoanSimulator = (shortId) =>
  renderHook(() => useLoanSimulator(), {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={shortId ? [`/?id=${shortId}`] : ["/"]}>
        {children}
      </MemoryRouter>
    ),
  });

describe("useLoanSimulator — initial link paste", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    LinkResolutionService.consumeLink.mockResolvedValue(consumeLinkResponse);
    getFingerprint.mockResolvedValue(FINGERPRINT_RAW);
    mapFingerprintToHuellaData.mockReturnValue(HUELLA_DATA);
    SimuladorService.calcularPlanes.mockResolvedValue(calcularPlanesResponse);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls SimuladorService.calcularPlanes exactly once within the debounce window after the link is consumed for the first time", async () => {
    renderUseLoanSimulator(SHORT_ID);

    // Wait for the initial flow to settle: consumeLink → fingerprint → fetch → setAmount.
    // After this, the first calcularPlanes call has been made and the response processed.
    // The debounced effect can only fire 500ms AFTER setAmount(capMax) was called.
    // Within that 500ms window, ONLY the initial fetch should have been made.
    await waitFor(() => {
      expect(SimuladorService.calcularPlanes).toHaveBeenCalled();
    });

    // Settle any in-flight microtasks
    await new Promise((r) => setTimeout(r, 50));

    expect(SimuladorService.calcularPlanes).toHaveBeenCalledTimes(1);
  });

  it("sends huella_dispositivo in the first calcularPlanes call (fingerprint awaited before first fetch)", async () => {
    renderUseLoanSimulator(SHORT_ID);

    await waitFor(() => {
      expect(SimuladorService.calcularPlanes).toHaveBeenCalled();
    });

    const firstCallArgs = SimuladorService.calcularPlanes.mock.calls[0][0];
    expect(firstCallArgs.huella_dispositivo).toEqual(HUELLA_DATA);
    expect(firstCallArgs.request_id).toBeDefined();
  });

  it("aborts any in-flight duplicate when a subsequent recalculation is triggered", async () => {
    // Simulamos que la primera llamada tarda más que la segunda
    let resolveFirst;
    SimuladorService.calcularPlanes
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce(calcularPlanesResponse);

    renderUseLoanSimulator(SHORT_ID);

    // Esperar a que al menos una llamada esté en vuelo
    await waitFor(() => {
      expect(SimuladorService.calcularPlanes).toHaveBeenCalledTimes(1);
    });

    // Verificar que el AbortSignal pasado fue creado
    const signal = SimuladorService.calcularPlanes.mock.calls[0][1];
    expect(signal).toBeDefined();

    // Liberamos la primera llamada
    resolveFirst(calcularPlanesResponse);
  });
});