// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mocks: declarados ANTES de importar el hook bajo test.
// Misma estructura que useLoanSimulator.test.jsx (la referencia del repo).
vi.mock("../../../../services/linkResolutionService.js", () => ({
  default: {
    consumeLink: vi.fn(),
  },
}));

vi.mock("../../../../services/simuladorService.js", () => ({
  default: {
    calcularPlanes: vi.fn(),
    iniciarSesion: vi.fn().mockResolvedValue({ success: true, data: { token: "mock-jwt" } }),
    validarCBU: vi.fn(),
    aceptarTerminos: vi.fn(),
    obtenerInfoPrestamo: vi.fn(),
  },
}));

vi.mock("../../../../lib/fingerprint.js", () => ({
  getFingerprint: vi.fn(),
  mapFingerprintToHuellaData: vi.fn(),
}));

vi.mock("../../../../lib/utils.js", () => ({
  getCookie: vi.fn(),
  setCookie: vi.fn().mockResolvedValue(undefined),
  setCookieWithDuration: vi.fn().mockResolvedValue(undefined),
  deleteCookie: vi.fn().mockResolvedValue(undefined),
  roundToFiveHundreds: (x) => Math.round(x / 500) * 500,
}));

// Note: useDebounce NO está mockeado (mismo criterio que la referencia).
// `capital_maximo_a_ofrecer: 0` mantiene `debouncedAmount` en 0 → la única
// llamada a calcularPlanes es la inicial (o el refresh explícito), lo que hace
// deterministas las asserts sobre el número de llamadas.

import LinkResolutionService from "../../../../services/linkResolutionService.js";
import SimuladorService from "../../../../services/simuladorService.js";
import { getFingerprint, mapFingerprintToHuellaData } from "../../../../lib/fingerprint.js";
import { getCookie, setCookie, setCookieWithDuration } from "../../../../lib/utils.js";
import { LOAN_SIM_STEPS } from "../../../../constants/LOAN_SIM.js";
import { useLoanSimulator } from "../useLoanSimulator";

const SHORT_ID = "abc123";
const SCORING_ID = "999";
const CUIT = "20123456789";
const CBU_VALUE = "0123456789012345678901";
const FINGERPRINT_RAW = {
  thumbmark: "tm-1",
  visitorId: "vid-1",
  requestId: "req-abc-123",
};
const HUELLA_DATA = { thumbmark: "tm-1", visitor_id: "vid-1" };

// Motivo que devuelve el backend cuando el asesor RECHAZA el cambio de CBU.
// Debe matchear MOTIVO_CBU_RECHAZADO del backend (Plan 2026-10-20).
const MOTIVO_CBU_RECHAZADO_POR_ASESOR = "CBU_RECHAZADO_POR_ASESOR";

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

/**
 * Respuesta de /calcular. `existingSimulation` es lo que el backend devuelve
 * cuando la simulación ya existía (restore) o cuando se acaba de re-consultar
 * (refresh). Con `null` no hay simulación previa → el hook queda en SIMULACION.
 */
const buildCalcularResponse = (existingSimulation) => ({
  success: true,
  data: {
    capital_maximo_a_ofrecer: 0,
    planes_disponibles: [],
    existingSimulation,
  },
});

const renderUseLoanSimulator = (shortId) =>
  renderHook(() => useLoanSimulator(), {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={shortId ? [`/?id=${shortId}`] : ["/"]}>
        {children}
      </MemoryRouter>
    ),
  });

describe("useLoanSimulator — gate de validación de CBU (Plan 2026-10-20)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    LinkResolutionService.consumeLink.mockResolvedValue(consumeLinkResponse);
    getFingerprint.mockResolvedValue(FINGERPRINT_RAW);
    mapFingerprintToHuellaData.mockReturnValue(HUELLA_DATA);
    SimuladorService.iniciarSesion.mockResolvedValue({
      success: true,
      data: { token: "mock-jwt" },
    });
    getCookie.mockResolvedValue(null);
    setCookie.mockResolvedValue(undefined);
    setCookieWithDuration.mockResolvedValue(undefined);
    // Reset defensivo: `vi.clearAllMocks()` NO limpia la cola de
    // mockResolvedValueOnce, así que una respuesta encolada por un test
    // anterior se consumiría en la primera llamada de este test.
    SimuladorService.calcularPlanes.mockReset();
    SimuladorService.calcularPlanes.mockResolvedValue(buildCalcularResponse(null));
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("validarCBU con pending:true → setStep(PENDING_CBU_VALIDATION) y NO llama aceptarTerminos", async () => {
    // El backend responde success:true + pending:true cuando la simulación
    // queda parked esperando la validación manual de un asesor.
    SimuladorService.validarCBU.mockResolvedValue({
      success: true,
      pending: true,
      estado: LOAN_SIM_STEPS.PENDING_CBU_VALIDATION,
      message: "Tu CBU/CVU está siendo validado por un asesor.",
    });
    SimuladorService.aceptarTerminos.mockResolvedValue({ success: true, skipMobbex: true });

    const { result } = renderUseLoanSimulator(SHORT_ID);
    await waitFor(() => expect(result.current.initialSimulationResolved).toBe(true));

    await act(async () => {
      await result.current.validarCBU(CBU_VALUE, "cbu");
    });

    expect(result.current.step).toBe(LOAN_SIM_STEPS.PENDING_CBU_VALIDATION);
    // El préstamo NO se puede crear mientras el asesor no valide.
    expect(SimuladorService.aceptarTerminos).not.toHaveBeenCalled();
  });

  it("validarCBU sin pending → sigue el flujo normal (llama aceptarTerminos)", async () => {
    // Regresión: la rama nueva sólo aplica con pending === true.
    SimuladorService.validarCBU.mockResolvedValue({
      success: true,
      message: "CBU validado con éxito",
    });
    SimuladorService.aceptarTerminos.mockResolvedValue({ success: true, skipMobbex: true });
    SimuladorService.obtenerInfoPrestamo.mockResolvedValue({
      success: true,
      data: { FechaDeSolicitud: "2026-10-20" },
    });

    const { result } = renderUseLoanSimulator(SHORT_ID);
    await waitFor(() => expect(result.current.initialSimulationResolved).toBe(true));

    await act(async () => {
      await result.current.validarCBU(CBU_VALUE, "cbu");
    });

    expect(SimuladorService.aceptarTerminos).toHaveBeenCalledTimes(1);
    expect(SimuladorService.aceptarTerminos).toHaveBeenCalledWith({ scoringId: SCORING_ID });
    expect(result.current.step).toBe(LOAN_SIM_STEPS.COMPLETADO);
  });

  it("restore con estado RECHAZADO y motivo CBU_RECHAZADO_POR_ASESOR → rejectionReason = CBU_REJECTED", async () => {
    SimuladorService.calcularPlanes.mockReset();
    SimuladorService.calcularPlanes.mockResolvedValue(
      buildCalcularResponse({
        id: 1,
        scoringId: SCORING_ID,
        estado: LOAN_SIM_STEPS.RECHAZADO,
        motivo: MOTIVO_CBU_RECHAZADO_POR_ASESOR,
      }),
    );

    const { result } = renderUseLoanSimulator(SHORT_ID);

    await waitFor(() => {
      expect(result.current.rejectionReason).toBe("CBU_REJECTED");
    });

    expect(result.current.step).toBe(LOAN_SIM_STEPS.RECHAZADO);
  });

  it("restore con estado RECHAZADO y otro motivo → NO setea CBU_REJECTED", async () => {
    SimuladorService.calcularPlanes.mockReset();
    SimuladorService.calcularPlanes.mockResolvedValue(
      buildCalcularResponse({
        id: 1,
        scoringId: SCORING_ID,
        estado: LOAN_SIM_STEPS.RECHAZADO,
        motivo: "OTRO_MOTIVO_DE_RECHAZO",
      }),
    );

    const { result } = renderUseLoanSimulator(SHORT_ID);

    await waitFor(() => {
      expect(result.current.initialSimulationResolved).toBe(true);
    });

    expect(result.current.step).toBe(LOAN_SIM_STEPS.RECHAZADO);
    expect(result.current.rejectionReason).not.toBe("CBU_REJECTED");
  });

  it("verificarEstadoCBU con la simulación aún en PENDING_CBU_VALIDATION → sigue en el mismo step", async () => {
    const pendingSimulation = {
      id: 1,
      scoringId: SCORING_ID,
      estado: LOAN_SIM_STEPS.PENDING_CBU_VALIDATION,
    };
    SimuladorService.calcularPlanes.mockReset();
    SimuladorService.calcularPlanes.mockResolvedValue(buildCalcularResponse(pendingSimulation));

    const { result } = renderUseLoanSimulator(SHORT_ID);
    await waitFor(() => {
      expect(result.current.step).toBe(LOAN_SIM_STEPS.PENDING_CBU_VALIDATION);
    });

    await act(async () => {
      await result.current.verificarEstadoCBU();
    });

    // El refresh re-consultó la simulación (1 llamada inicial + 1 refresh).
    expect(SimuladorService.calcularPlanes).toHaveBeenCalledTimes(2);
    expect(result.current.step).toBe(LOAN_SIM_STEPS.PENDING_CBU_VALIDATION);
  });

  it("verificarEstadoCBU con la simulación en RECHAZADO → va a la pantalla de rechazo", async () => {
    const pendingSimulation = {
      id: 1,
      scoringId: SCORING_ID,
      estado: LOAN_SIM_STEPS.PENDING_CBU_VALIDATION,
    };
    const rejectedSimulation = {
      id: 1,
      scoringId: SCORING_ID,
      estado: LOAN_SIM_STEPS.RECHAZADO,
      motivo: MOTIVO_CBU_RECHAZADO_POR_ASESOR,
    };

    SimuladorService.calcularPlanes.mockReset();
    SimuladorService.calcularPlanes.mockResolvedValue(buildCalcularResponse(rejectedSimulation));
    SimuladorService.calcularPlanes.mockResolvedValueOnce(buildCalcularResponse(pendingSimulation));

    const { result } = renderUseLoanSimulator(SHORT_ID);
    await waitFor(() => {
      expect(result.current.step).toBe(LOAN_SIM_STEPS.PENDING_CBU_VALIDATION);
    });

    await act(async () => {
      await result.current.verificarEstadoCBU();
    });

    expect(result.current.step).toBe(LOAN_SIM_STEPS.RECHAZADO);
    expect(result.current.rejectionReason).toBe("CBU_REJECTED");
  });

  it("verificarEstadoCBU con la simulación en CBU_VALIDATION (aprobada) → vuelve al paso de CBU", async () => {
    const pendingSimulation = {
      id: 1,
      scoringId: SCORING_ID,
      estado: LOAN_SIM_STEPS.PENDING_CBU_VALIDATION,
    };
    const approvedSimulation = {
      id: 1,
      scoringId: SCORING_ID,
      estado: LOAN_SIM_STEPS.CBU_VALIDATION,
    };

    SimuladorService.calcularPlanes.mockReset();
    SimuladorService.calcularPlanes.mockResolvedValue(buildCalcularResponse(approvedSimulation));
    SimuladorService.calcularPlanes.mockResolvedValueOnce(buildCalcularResponse(pendingSimulation));

    const { result } = renderUseLoanSimulator(SHORT_ID);
    await waitFor(() => {
      expect(result.current.step).toBe(LOAN_SIM_STEPS.PENDING_CBU_VALIDATION);
    });

    await act(async () => {
      await result.current.verificarEstadoCBU();
    });

    expect(result.current.step).toBe(LOAN_SIM_STEPS.CBU_VALIDATION);
  });

  // Drift guard del mensaje de error (fix final de rama).
  //
  // El error handler del back responde SIEMPRE HTTP 200 con
  // `{ success:false, status, message, cause }` → el `if (!response.ok) throw`
  // del front NUNCA dispara y el front recibe el body con `success:false`.
  // El `message` es user-facing ("Tu solicitud anterior expiró...") y el
  // `cause` es técnico ("SIMULADOR_PRESTAMOS_SERVICE_SIMULATION_EXPIRED").
  // Este test fija que al usuario se le muestra el `message` y nunca el
  // `cause` crudo.
  it("verificarEstadoCBU con la simulación vencida → el error es el mensaje legible del back, NO el cause crudo", async () => {
    const pendingSimulation = {
      id: 1,
      scoringId: SCORING_ID,
      estado: LOAN_SIM_STEPS.PENDING_CBU_VALIDATION,
    };
    const expiredResponse = {
      success: false,
      status: 400,
      message: "Tu solicitud anterior expiró. Por favor, iniciala nuevamente",
      cause: "SIMULADOR_PRESTAMOS_SERVICE_SIMULATION_EXPIRED",
    };

    SimuladorService.calcularPlanes.mockReset();
    SimuladorService.calcularPlanes.mockResolvedValue(expiredResponse);
    SimuladorService.calcularPlanes.mockResolvedValueOnce(buildCalcularResponse(pendingSimulation));

    const { result } = renderUseLoanSimulator(SHORT_ID);
    await waitFor(() => {
      expect(result.current.step).toBe(LOAN_SIM_STEPS.PENDING_CBU_VALIDATION);
    });

    await act(async () => {
      await result.current.verificarEstadoCBU();
    });

    // Lo que ve el usuario es el `message` user-facing del back...
    expect(result.current.error).toContain("Tu solicitud anterior expiró");
    // ...y nunca el `cause` técnico.
    expect(result.current.error).not.toContain("SIMULADOR_PRESTAMOS_SERVICE_SIMULATION_EXPIRED");
    // El fallo no kicks al lead a otra pantalla: sigue en la de espera,
    // que es donde el mensaje de error se muestra.
    expect(result.current.step).toBe(LOAN_SIM_STEPS.PENDING_CBU_VALIDATION);
  });
});
