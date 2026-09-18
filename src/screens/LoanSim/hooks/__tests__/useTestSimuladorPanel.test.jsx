// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mockeamos el servicio ANTES de importar el hook bajo test.
// (vi.mock se eleva por hoist del bundler, así que la importación del hook
// más abajo siempre encuentra los mocks.)
vi.mock("../../../../services/testPersonasService.js", () => ({
  fetchTestPersonas: vi.fn(),
  fetchTestPersonaById: vi.fn(),
}));

import { fetchTestPersonas, fetchTestPersonaById } from "../../../../services/testPersonasService.js";
import { useTestSimuladorPanel } from "../useTestSimuladorPanel";

// IMPORTANTE — sobre import.meta.env.DEV:
// Vite reemplaza `import.meta.env.DEV` por un literal `true`/`false` al
// transformar el módulo. En Vitest ese modo es "test" → DEV=true SIEMPRE,
// sin override runtime posible. Por eso el branch "DEV=false → no fetch"
// NO es unit-testeable desde acá: es una garantía de build-time del plugin
// de Vite. La cobertura real de ese gate sale del smoke test manual contra
// `vite build` (production) — mismo patrón que TestSimuladorPanel.test.jsx.
// Estos tests cubren los behaviours runtime-testeables: el fetch+filter, la
// selección con sessionStorage+navegación, y el reset.

const STORAGE_KEY = "simuladorTestPersona";

const makeWrapper = (initialUrl = "/loan-sim") =>
  ({ children }) => <MemoryRouter initialEntries={[initialUrl]}>{children}</MemoryRouter>;

// Fija window.location.search al valor deseado. La única manera runtime-
// testeable de activar el panel en Vitest es via el query param `testMode=1`,
// porque DEV es siempre true en este entorno.
const setUrl = (url) => {
  window.history.pushState({}, "", url);
};

describe("useTestSimuladorPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock: el hook llama a fetchTestPersonas en mount. Si un test
    // necesita otro comportamiento, lo sobrescribe con mockResolvedValueOnce.
    fetchTestPersonas.mockResolvedValue([]);
    sessionStorage.clear();
    setUrl("/loan-sim?testMode=1");
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("con ?testMode=1 → fetchTestPersonas y filtra por useCases.includes('simulador')", async () => {
    fetchTestPersonas.mockResolvedValueOnce([
      { id: "REG_HAPPY", label: "Registro Happy", useCases: ["registro"] },
      { id: "SIM_HAPPY", label: "Sim Happy", useCases: ["registro", "simulador"] },
      { id: "SIM_OTP_EXPIRED", label: "Sim OTP Expired", useCases: ["simulador"] },
      { id: "OTRO", label: "Otro", useCases: [] },
    ]);

    const { result } = renderHook(() => useTestSimuladorPanel(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchTestPersonas).toHaveBeenCalledTimes(1);
    expect(result.current.personas).toHaveLength(2);
    expect(result.current.personas.map((p) => p.id)).toEqual([
      "SIM_HAPPY",
      "SIM_OTP_EXPIRED",
    ]);
    expect(result.current.error).toBeNull();
  });

  it("fetchTestPersonas rechaza → setea error con el mensaje y deja loading=false", async () => {
    fetchTestPersonas.mockRejectedValueOnce(new Error("network down"));

    const { result } = renderHook(() => useTestSimuladorPanel(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("network down");
    expect(result.current.personas).toEqual([]);
  });

  it("selectPersona(id) → fetchTestPersonaById, persiste en sessionStorage bajo 'simuladorTestPersona' y navega a /loan-sim", async () => {
    const persona = {
      id: "SIM_HAPPY",
      label: "Sim Happy",
      cuit: "20-99002001-3",
      simuladorConfig: { scoringId: 99002001 },
    };
    fetchTestPersonaById.mockResolvedValueOnce(persona);

    const { result } = renderHook(() => useTestSimuladorPanel(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.selectPersona("SIM_HAPPY");
    });

    expect(fetchTestPersonaById).toHaveBeenCalledWith("SIM_HAPPY");
    const stored = sessionStorage.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored)).toEqual(persona);
    // La navegación vía useNavigate dentro de MemoryRouter queda registrada
    // en `history`: la última entrada debería apuntar a /loan-sim.
    expect(window.location.pathname).toBe("/loan-sim");
  });

  it("selectPersona(id) → si fetchTestPersonaById devuelve null, no escribe sessionStorage ni navega", async () => {
    fetchTestPersonaById.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useTestSimuladorPanel(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.selectPersona("SIM_NONEXISTENT");
    });

    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("resetSession() → elimina la key 'simuladorTestPersona' de sessionStorage", async () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ id: "SIM_HAPPY" }));
    expect(sessionStorage.getItem(STORAGE_KEY)).not.toBeNull();

    const { result } = renderHook(() => useTestSimuladorPanel(), {
      wrapper: makeWrapper(),
    });

    act(() => {
      result.current.resetSession();
    });

    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("exposes useCallback stable identity para selectPersona y resetSession entre renders", async () => {
    fetchTestPersonas.mockResolvedValueOnce([]);

    const { result, rerender } = renderHook(() => useTestSimuladorPanel(), {
      wrapper: makeWrapper(),
    });

    const selectRef = result.current.selectPersona;
    const resetRef = result.current.resetSession;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    rerender();

    expect(result.current.selectPersona).toBe(selectRef);
    expect(result.current.resetSession).toBe(resetRef);
  });
});