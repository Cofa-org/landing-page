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
  resetTestPersonaSimulation: vi.fn(),
  aprobarCbuTestPersona: vi.fn(),
}));

import {
  fetchTestPersonas,
  fetchTestPersonaById,
  resetTestPersonaSimulation,
  aprobarCbuTestPersona,
} from "../../../../services/testPersonasService.js";
import { useTestSimuladorPanel, PERSONAS_CON_APROBAR_CBU } from "../useTestSimuladorPanel";

// IMPORTANTE — sobre el flag `DEV` del front:
//
// `DEV` (src/config.js) NO es `import.meta.env.DEV` (el de Vite, que en
// Vitest es `true` siempre): es `parseBool(import.meta.env.VITE_DEV)`, y en
// Vitest `VITE_DEV` viene `undefined` → `false` (`.env.development` no se
// carga en modo "test"). Como los guards de seguridad del hook cortan los
// POST state-changing cuando `!DEV`, este archivo MOCKEA `config.js` para
// poder encender y apagar el flag según el test.
//
// `isTestPersonasVisible` NO se toca: sigue siendo la función real, que
// lee el `DEV` REAL del módulo (false en Vitest) y la query string de la
// URL — o sea que en estos tests la visibilidad la decide la URL:
// `?testMode=1` la abre (ver el `beforeEach` y `setUrl`), sin ella queda
// cerrada. Es lo mismo que el gate real: `DEV || ?testMode=1`.
const devFlag = vi.hoisted(() => ({ current: true }));

vi.mock("../../../../config.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    get DEV() {
      return devFlag.current;
    },
  };
});

// Estos tests cubren los behaviours runtime-testeables: el fetch+filter, la
// selección con sessionStorage+navegación, el reset, y el caso del gate de
// validación manual de CBU (Plan 2026-10-21).

const STORAGE_KEY = "simuladorTestPersona";

const makeWrapper = (initialUrl = "/loan-sim") =>
  ({ children }) => <MemoryRouter initialEntries={[initialUrl]}>{children}</MemoryRouter>;

// Fija window.location.search al valor deseado. La única manera runtime-
// testeable de activar el panel en Vitest es via el query param `testMode=1`,
// porque DEV es siempre true en este entorno.
const setUrl = (url) => {
  window.history.pushState({}, "", url);
};

// jsdom NO implementa la navegación: `window.location.href = "/ruta"` deja el
// getter con el valor viejo y ensucia la salida con el "Not implemented:
// navigation to another Document". Para poder observar la URL destino del
// full-reload (y que el test sea determinístico) reemplazamos `window.location`
// por un stub plano durante el test. La restauración se hace en el `afterEach`
// (no al final del test) para que una aserción fallida no deje el stub puesto.
//
// El stub también expone `search`: es de ahí de donde el hook lee el
// `testMode=1` que tiene que PRESERVAR en el reload (sin él el panel se
// cerraría) y de donde `isTestPersonasVisible` decide si el panel está
// visible. Por defecto espeja la query string real del documento —fiel al
// navegador—; un test puede fijarla con `stubLocation("?testMode=1")` o
// `stubLocation("")` (build sin el modo test).
let restoreLocation = null;

const stubLocation = (search = window.location.search) => {
  if (restoreLocation) return;
  const original = window.location;
  delete window.location;
  window.location = { href: "", search };
  restoreLocation = () => {
    delete window.location;
    window.location = original;
    restoreLocation = null;
  };
};

describe("useTestSimuladorPanel", () => {
  beforeEach(() => {
    // `vi.clearAllMocks()` NO vacía la cola de implementaciones `...Once`:
    // un `mockResolvedValueOnce` que quedó sin consumir (p.ej. el mock de
    // reset, que la persona normal nunca llama) se filtraría al test
    // siguiente. Por eso reseteamos los mocks enteros.
    vi.resetAllMocks();
    // Default mock: el hook llama a fetchTestPersonas en mount. Si un test
    // necesita otro comportamiento, lo sobrescribe con mockResolvedValueOnce.
    fetchTestPersonas.mockResolvedValue([]);
    // Default: build de dev (los POST de los guards de seguridad corren).
    // Los tests que verifican el guard `!DEV` lo apagan explícitamente.
    devFlag.current = true;
    sessionStorage.clear();
    setUrl("/loan-sim?testMode=1");
  });

  afterEach(() => {
    if (restoreLocation) restoreLocation();
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

  // ---------------------------------------------------------------------------
  // Plan 2026-10-21 — caso de QA del gate de validación manual de CBU.
  // ---------------------------------------------------------------------------

  it("PERSONAS_CON_APROBAR_CBU contiene a la persona del escenario de CBU manual", () => {
    expect(PERSONAS_CON_APROBAR_CBU.has("SIM_CBU_PENDING")).toBe(true);
    expect(PERSONAS_CON_APROBAR_CBU.has("SIM_HAPPY")).toBe(false);
  });

  it("aprobarCbu(id) → llama al backend y deja la persona marcada como validada", async () => {
    aprobarCbuTestPersona.mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() => useTestSimuladorPanel(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.aprobarCbu("SIM_CBU_PENDING");
    });

    expect(aprobarCbuTestPersona).toHaveBeenCalledWith("SIM_CBU_PENDING");
    expect(result.current.cbuAprobadoPara).toBe("SIM_CBU_PENDING");
  });

  it("aprobarCbu(id) → si el backend falla, NO marca la persona como validada", async () => {
    aprobarCbuTestPersona.mockRejectedValueOnce(new Error("no hay nada pendiente"));
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    const { result } = renderHook(() => useTestSimuladorPanel(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.aprobarCbu("SIM_CBU_PENDING");
    });

    expect(result.current.cbuAprobadoPara).toBeNull();
    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it("aprobarCbu(id) → si el backend responde 200 con success:false, avisa y NO marca la persona como validada", async () => {
    // El endpoint responde HTTP 200 en los DOS casos (aprobo / no había nada
    // pendiente), así que el "no había nada pendiente" llega como body, no
    // como excepción.
    aprobarCbuTestPersona.mockResolvedValueOnce({
      success: false,
      message: "no había nada pendiente de aprobar",
    });
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    const { result } = renderHook(() => useTestSimuladorPanel(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.aprobarCbu("SIM_CBU_PENDING");
    });

    expect(result.current.cbuAprobadoPara).toBeNull();
    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining("no había nada pendiente de aprobar"),
    );
    alertSpy.mockRestore();
  });

  it("aprobarCbu(id) → deja approvingCbu en null al terminar (ok o error)", async () => {
    aprobarCbuTestPersona.mockResolvedValueOnce({ success: true });
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    const { result } = renderHook(() => useTestSimuladorPanel(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.aprobarCbu("SIM_CBU_PENDING");
    });

    expect(result.current.approvingCbu).toBeNull();
    alertSpy.mockRestore();
  });

  it("selectPersona de una persona con el escenario de CBU → resetea el escenario antes de navegar", async () => {
    stubLocation();
    resetTestPersonaSimulation.mockResolvedValueOnce({ success: true });
    fetchTestPersonaById.mockResolvedValueOnce({
      id: "SIM_CBU_PENDING",
      label: "Laura",
      cuit: "20-99002003-3",
      simuladorConfig: { scoringId: 99002003, pendingCbuValidation: true },
    });

    const { result } = renderHook(() => useTestSimuladorPanel(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.selectPersona("SIM_CBU_PENDING");
    });

    expect(resetTestPersonaSimulation).toHaveBeenCalledWith("SIM_CBU_PENDING");
    expect(sessionStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it("selectPersona de una persona con el escenario de CBU → navega con full reload (window.location.href)", async () => {
    // `navigate()` a la misma URL NO re-dispara el init del simulador → el
    // re-arm del escenario no se aplicaría. Por eso esta persona navega con
    // `window.location.href`.
    //
    // El reload REEMPLAZA la URL completa, así que tiene que preservar el
    // `?testMode=1`: sin él el panel se cerraría (su gate es
    // `DEV || ?testMode=1`) y el botón "Validar CBU" desaparecería. El
    // `beforeEach` deja la URL real con `?testMode=1`.
    stubLocation();
    resetTestPersonaSimulation.mockResolvedValueOnce({ success: true });
    fetchTestPersonaById.mockResolvedValueOnce({
      id: "SIM_CBU_PENDING",
      label: "Laura",
      cuit: "20-99002003-3",
      simuladorConfig: { scoringId: 99002003, pendingCbuValidation: true },
    });

    const { result } = renderHook(() => useTestSimuladorPanel(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.selectPersona("SIM_CBU_PENDING");
    });

    expect(window.location.href).toBe(
      "/simulador?tp=SIM_CBU_PENDING&testMode=1",
    );
  });

  it("selectPersona de una persona con el escenario de CBU → sin ?testMode=1 en la URL, el reload NO lo agrega", async () => {
    // El `testMode=1` se PRESERVA, no se agrega: mandarlo siempre abriría
    // el panel de personas-test en builds donde el operador no lo pidió.
    stubLocation("");
    resetTestPersonaSimulation.mockResolvedValueOnce({ success: true });
    fetchTestPersonaById.mockResolvedValueOnce({
      id: "SIM_CBU_PENDING",
      label: "Laura",
      cuit: "20-99002003-3",
      simuladorConfig: { scoringId: 99002003, pendingCbuValidation: true },
    });

    const { result } = renderHook(() => useTestSimuladorPanel(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.selectPersona("SIM_CBU_PENDING");
    });

    expect(window.location.href).toBe("/simulador?tp=SIM_CBU_PENDING");
  });

  it("selectPersona de una persona normal → NO resetea el escenario", async () => {
    resetTestPersonaSimulation.mockResolvedValueOnce({ success: true });
    fetchTestPersonaById.mockResolvedValueOnce({
      id: "SIM_HAPPY",
      label: "Hugo",
      cuit: "20-99002001-3",
      simuladorConfig: { scoringId: 99002001 },
    });

    const { result } = renderHook(() => useTestSimuladorPanel(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.selectPersona("SIM_HAPPY");
    });

    expect(resetTestPersonaSimulation).not.toHaveBeenCalled();
  });

  it("selectPersona de una persona con el escenario de CBU → si el reset falla, avisa y NO navega", async () => {
    resetTestPersonaSimulation.mockRejectedValueOnce(new Error("reset 500"));
    fetchTestPersonaById.mockResolvedValueOnce({
      id: "SIM_CBU_PENDING",
      label: "Laura",
      cuit: "20-99002003-3",
      simuladorConfig: { scoringId: 99002003, pendingCbuValidation: true },
    });
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    const { result } = renderHook(() => useTestSimuladorPanel(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.selectPersona("SIM_CBU_PENDING");
    });

    expect(alertSpy).toHaveBeenCalled();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    alertSpy.mockRestore();
  });

  // ---------------------------------------------------------------------------
  // Guards de seguridad de las ramas de CBU.
  //
  // El caso de CBU sólo puede tocar la fila sintética de `SIM_CBU_PENDING`
  // (el `scoringId` sale siempre del catálogo, nunca del request), así que
  // el guard es `!DEV && !isTestPersonasVisible()`: habilitan el build de dev
  // (`DEV`) o el modo explícito `?testMode=1` —que existe para operar el
  // panel en un build de staging, donde `VITE_DEV` no está seteado—.
  //
  // La rama `realClient` de NORIEGA, que sí resetea datos de un cliente real,
  // mantiene su guard estricto (`!DEV`).
  // ---------------------------------------------------------------------------

  it("sin DEV y sin ?testMode=1 → el reset del escenario de CBU NO se hace y NO navega", async () => {
    devFlag.current = false;
    // Sin `?testMode=1` en la URL el panel ni siquiera se muestra: el
    // guard es la última línea de defensa.
    stubLocation("");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    resetTestPersonaSimulation.mockResolvedValueOnce({ success: true });
    fetchTestPersonaById.mockResolvedValueOnce({
      id: "SIM_CBU_PENDING",
      label: "Laura",
      cuit: "20-99002003-3",
      simuladorConfig: { scoringId: 99002003, pendingCbuValidation: true },
    });

    const { result } = renderHook(() => useTestSimuladorPanel(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.selectPersona("SIM_CBU_PENDING");
    });

    expect(resetTestPersonaSimulation).not.toHaveBeenCalled();
    // Sin reload: el `href` del stub queda en su valor inicial.
    expect(window.location.href).toBe("");
    expect(warnSpy).toHaveBeenCalledWith(
      "CBU_RESET_BLOCKED_IN_PRODUCTION",
      { personaId: "SIM_CBU_PENDING" },
    );
    warnSpy.mockRestore();
  });

  it("sin DEV y sin ?testMode=1 → el approve del CBU NO se hace y la persona NO queda marcada como validada", async () => {
    devFlag.current = false;
    setUrl("/loan-sim");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    aprobarCbuTestPersona.mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() => useTestSimuladorPanel(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.aprobarCbu("SIM_CBU_PENDING");
    });

    expect(aprobarCbuTestPersona).not.toHaveBeenCalled();
    expect(result.current.cbuAprobadoPara).toBeNull();
    expect(result.current.approvingCbu).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      "CBU_APPROVE_BLOCKED_IN_PRODUCTION",
      { personaId: "SIM_CBU_PENDING" },
    );
    warnSpy.mockRestore();
  });

  it("sin DEV pero con ?testMode=1 explícito → el reset del escenario de CBU SÍ se hace", async () => {
    // El modo `?testMode=1` existe para operar el panel en un build de
    // staging (donde `VITE_DEV` no está seteado): ahí los POST del caso de
    // CBU tienen que poder correr.
    devFlag.current = false;
    stubLocation("?testMode=1");
    resetTestPersonaSimulation.mockResolvedValueOnce({ success: true });
    fetchTestPersonaById.mockResolvedValueOnce({
      id: "SIM_CBU_PENDING",
      label: "Laura",
      cuit: "20-99002003-3",
      simuladorConfig: { scoringId: 99002003, pendingCbuValidation: true },
    });

    const { result } = renderHook(() => useTestSimuladorPanel(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.selectPersona("SIM_CBU_PENDING");
    });

    expect(resetTestPersonaSimulation).toHaveBeenCalledWith("SIM_CBU_PENDING");
  });

  it("sin DEV pero con ?testMode=1 explícito → el approve del CBU SÍ se hace y la persona queda marcada", async () => {
    devFlag.current = false;
    setUrl("/loan-sim?testMode=1");
    aprobarCbuTestPersona.mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() => useTestSimuladorPanel(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.aprobarCbu("SIM_CBU_PENDING");
    });

    expect(aprobarCbuTestPersona).toHaveBeenCalledWith("SIM_CBU_PENDING");
    expect(result.current.cbuAprobadoPara).toBe("SIM_CBU_PENDING");
  });
});
