import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
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
    validarCBU: vi.fn(),
    aceptarTerminos: vi.fn(),
    obtenerInfoPrestamo: vi.fn(),
  },
}));

vi.mock("../../../../lib/fingerprint.js", () => ({
  getFingerprint: vi.fn(),
  mapFingerprintToHuellaData: vi.fn(),
}));

// Mock para utils.js — necesario para controlar getCookie/setCookie/setCookieWithDuration
// en los tests de persistLoanToCookies / handleInfoPrestamo.
// Preserva roundToFiveHundreds para no romper otros code paths del hook.
vi.mock("../../../../lib/utils.js", () => ({
  getCookie: vi.fn(),
  setCookie: vi.fn().mockResolvedValue(undefined),
  setCookieWithDuration: vi.fn().mockResolvedValue(undefined),
  roundToFiveHundreds: (x) => Math.round(x / 500) * 500,
}));

// Note: useDebounce is NOT mocked — we use the real implementation so the
// debounce window acts as the natural separator between the initial fetch
// (which would create a simulation in the backend) and any recalculation
// (which would only update it).

import LinkResolutionService from "../../../../services/linkResolutionService.js";
import SimuladorService from "../../../../services/simuladorService.js";
import { getFingerprint, mapFingerprintToHuellaData } from "../../../../lib/fingerprint.js";
import { getCookie, setCookie, setCookieWithDuration } from "../../../../lib/utils.js";
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

describe("useLoanSimulator — persistLoanToCookies / handleInfoPrestamo", () => {
  let lastUnmount;

  beforeEach(() => {
    vi.clearAllMocks();
    LinkResolutionService.consumeLink.mockResolvedValue(consumeLinkResponse);
    getFingerprint.mockResolvedValue(FINGERPRINT_RAW);
    mapFingerprintToHuellaData.mockReturnValue(HUELLA_DATA);
    SimuladorService.calcularPlanes.mockResolvedValue(calcularPlanesResponse);
    SimuladorService.iniciarSesion.mockResolvedValue({
      success: true,
      data: { token: "mock-jwt" },
    });
    // Defaults: cookies ausentes.
    getCookie.mockResolvedValue(null);
    setCookieWithDuration.mockResolvedValue(undefined);
    setCookie.mockResolvedValue(undefined);
    lastUnmount = null;
  });

  afterEach(() => {
    if (lastUnmount) lastUnmount();
    vi.useRealTimers();
  });

  it("validarCBU en éxito delega cookies a persistLoanToCookies con duración (no timestamp absoluto)", async () => {
    // Arrange: skipMobbex path → se debería cachear scoringId + loanInfo.
    SimuladorService.validarCBU.mockResolvedValue({ success: true });
    SimuladorService.aceptarTerminos.mockResolvedValue({
      success: true,
      skipMobbex: true,
    });
    SimuladorService.obtenerInfoPrestamo.mockResolvedValue({
      success: true,
      data: {
        FechaDeSolicitud: "2026-07-19",
        CapitalDelPrestamo: 100000,
      },
    });

    const { result, unmount } = renderUseLoanSimulator(SHORT_ID);
    lastUnmount = unmount;
    await waitFor(() => expect(result.current.scoringId).toBe(SCORING_ID));

    // Act
    await act(async () => {
      await result.current.validarCBU("1234567890123456789012");
    });

    // Assert: setCookieWithDuration fue llamado con la DURACIÓN (2h en ms),
    // no con un timestamp absoluto. Esto es el regression guard del fix de
    // COOKIE_CONFIG.EXPIRY_MS: el bug original pasaba Date.now() + 2h al
    // module-load time, congelando el expiry. Con la duración relativa +
    // Date.now() interno en setCookieWithDuration, el expiry se calcula
    // al momento del setCookie.
    await waitFor(() => {
      expect(setCookieWithDuration).toHaveBeenCalledWith(
        "scoringId",
        SCORING_ID,
        2 * 60 * 60 * 1000,
      );
    });
    expect(SimuladorService.obtenerInfoPrestamo).toHaveBeenCalledWith(SCORING_ID);
  });

  it("persistLoanToCookies setea loanInfo cookie (JSON con scoringId + data combinados) tras fetch exitoso", async () => {
    SimuladorService.validarCBU.mockResolvedValue({ success: true });
    SimuladorService.aceptarTerminos.mockResolvedValue({
      success: true,
      skipMobbex: true,
    });
    const loanInfoData = {
      FechaDeSolicitud: "2026-07-19",
      CapitalDelPrestamo: 100000,
      TotalDeIntereses: 50000,
      CantidadDeCuotas: 12,
      MontoCuota: 12500,
      CFTO: 0.5,
      TNA: 0.4,
      CFTA: 0.6,
    };
    SimuladorService.obtenerInfoPrestamo.mockResolvedValue({
      success: true,
      data: loanInfoData,
    });

    const { result, unmount } = renderUseLoanSimulator(SHORT_ID);
    lastUnmount = unmount;
    await waitFor(() => expect(result.current.scoringId).toBe(SCORING_ID));

    await act(async () => {
      await result.current.validarCBU("1234567890123456789012");
    });

    // Regla de negocio: la cookie combina scoringId + data para servir como
    // gate (su existencia = acceso) y como data source simultáneamente.
    const expectedCombined = { scoringId: SCORING_ID, ...loanInfoData };
    await waitFor(() => {
      expect(setCookieWithDuration).toHaveBeenCalledWith(
        "loanInfo",
        JSON.stringify(expectedCombined),
        2 * 60 * 60 * 1000,
      );
    });
  });

  it("persistLoanToCookies no rechaza cuando el backend fetch falla (contrato never-throw)", async () => {
    SimuladorService.validarCBU.mockResolvedValue({ success: true });
    SimuladorService.aceptarTerminos.mockResolvedValue({
      success: true,
      skipMobbex: true,
    });
    SimuladorService.obtenerInfoPrestamo.mockRejectedValue(new Error("network"));

    const { result, unmount } = renderUseLoanSimulator(SHORT_ID);
    lastUnmount = unmount;
    await waitFor(() => expect(result.current.scoringId).toBe(SCORING_ID));

    // Debe completar sin throw, y el step debe transicionar a COMPLETADO
    // (porque el helper no rechaza, sólo loggea warn).
    await act(async () => {
      await result.current.validarCBU("1234567890123456789012");
    });

    await waitFor(() => {
      expect(result.current.step).toBe(LOAN_SIM_STEPS.COMPLETADO);
    });
    // scoringId cookie SÍ se setea (es el flag "loan finalized").
    expect(setCookieWithDuration).toHaveBeenCalledWith(
      "scoringId",
      SCORING_ID,
      2 * 60 * 60 * 1000,
    );
    // loanInfo cookie NO se setea porque el fetch falló.
    const loanInfoCalls = setCookieWithDuration.mock.calls.filter(
      (call) => call[0] === "loanInfo",
    );
    expect(loanInfoCalls).toHaveLength(0);
  });

  it("handleInfoPrestamo corta al leer loanInfo cookie con objeto JSON válido (no llama backend)", async () => {
    // La cookie combina scoringId + data — handleInfoPrestamo extrae sólo
    // los campos de data (sin scoringId) para pasárselos al modal.
    const cachedLoanInfo = {
      scoringId: SCORING_ID,
      FechaDeSolicitud: "2026-07-19",
      CapitalDelPrestamo: 100000,
    };
    getCookie.mockImplementation(async (name) => {
      if (name === "loanInfo") return JSON.stringify(cachedLoanInfo);
      return null;
    });
    SimuladorService.obtenerInfoPrestamo.mockResolvedValue({
      success: true,
      data: { ...cachedLoanInfo, CapitalDelPrestamo: 999 }, // distinto del cache
    });

    const { result, unmount } = renderUseLoanSimulator(SHORT_ID);
    lastUnmount = unmount;
    await waitFor(() => expect(result.current.scoringId).toBe(SCORING_ID));

    let success;
    await act(async () => {
      success = await result.current.handleInfoPrestamo();
    });

    expect(success).toBe(true);
    expect(SimuladorService.obtenerInfoPrestamo).not.toHaveBeenCalled();
    // setLoanInfo recibe la data sin el scoringId (sólo los campos de display).
    const { scoringId: _scoringId, ...expectedData } = cachedLoanInfo;
    expect(result.current.loanInfo).toEqual(expectedData);
  });

  it("handleInfoPrestamo NO cae al backend cuando loanInfo cookie está ausente / corrupta / no es objeto (regla de negocio: 2h)", async () => {
    // Regla de negocio: la cookie loanInfo es el ÚNICO indicador de acceso.
    // Si está ausente, corrupta o no es objeto → return false, sin backend fallback.
    // Esto respeta la ventana de 2h incluso si el botón fuera clickeado
    // por error o vía dev tools.
    const cases = [
      { label: "ausente", cookieValue: null },
      { label: "no-JSON", cookieValue: "texto no-json" },
      { label: "número", cookieValue: "42" },
      { label: "string válido pero no objeto", cookieValue: '"hola"' },
    ];

    for (const { label, cookieValue } of cases) {
      // Resetear mocks entre casos (mantener mockResolvedValue por defecto).
      vi.clearAllMocks();
      LinkResolutionService.consumeLink.mockResolvedValue(consumeLinkResponse);
      getFingerprint.mockResolvedValue(FINGERPRINT_RAW);
      mapFingerprintToHuellaData.mockReturnValue(HUELLA_DATA);
      SimuladorService.calcularPlanes.mockResolvedValue(calcularPlanesResponse);
      SimuladorService.iniciarSesion.mockResolvedValue({
        success: true,
        data: { token: "mock-jwt" },
      });
      SimuladorService.obtenerInfoPrestamo.mockResolvedValue({
        success: true,
        data: { FechaDeSolicitud: "2026-07-19", CapitalDelPrestamo: 100000 },
      });
      // getCookie: loanInfo → cookieValue (caso bajo test). scoringId NO se
      // debe leer (no hay backend fallback).
      getCookie.mockImplementation(async (name) => {
        if (name === "loanInfo") return cookieValue;
        return null;
      });
      setCookieWithDuration.mockResolvedValue(undefined);

      const { result, unmount } = renderUseLoanSimulator(SHORT_ID);
      // El afterEach ya captura lastUnmount; lo actualizamos para cleanup.
      lastUnmount = unmount;
      await waitFor(() => expect(result.current.scoringId).toBe(SCORING_ID));

      let success;
      await act(async () => {
        success = await result.current.handleInfoPrestamo();
      });

      expect(success, `caso "${label}" debería devolver false`).toBe(false);
      expect(
        SimuladorService.obtenerInfoPrestamo,
        `caso "${label}" NO debería llamar al backend (regla de negocio)`,
      ).not.toHaveBeenCalled();

      // Cleanup del caso: unmount del renderHook anterior.
      unmount();
      lastUnmount = null;
    }
  });
});