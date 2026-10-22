// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TestSimuladorPanel from "../TestSimuladorPanel.jsx";

/**
 * Wrap under test in MemoryRouter so `useSearchParams` (called by the panel)
 * can read the URL's query string.
 *
 * IMPORTANTE — sobre el gate del panel:
 * `isTestPersonasVisible()` (src/config.js) es
 * `DEV || new URLSearchParams(window.location.search).get("testMode") === "1"`,
 * y `DEV` es `parseBool(import.meta.env.VITE_DEV)` — NO `import.meta.env.DEV`
 * (en el test `VITE_DEV` viene `undefined` → `false`). `MemoryRouter` **NO**
 * cambia `window.location`: su `initialEntries` sólo afecta al router. Sin
 * el `pushState` de abajo el panel devuelve `null` y los tests de render
 * fallan. Mismo patrón que `hooks/__tests__/useTestSimuladorPanel.test.jsx`.
 *
 * Estos tests cubren los behaviours runtime-testeables: el gate de personas
 * vacías, el render positivo con `?testMode=1`, y el callback onSelect.
 */
const renderWithRouter = (ui, initialUrl = "/loan-sim") =>
  render(<MemoryRouter initialEntries={[initialUrl]}>{ui}</MemoryRouter>);

// Fija la URL REAL del documento — la única vía runtime-testeable de abrir
// el gate del panel en Vitest (el query param `testMode=1`).
const setUrl = (url) => {
  window.history.pushState({}, "", url);
};

describe("TestSimuladorPanel", () => {
  beforeEach(() => {
    setUrl("/loan-sim?testMode=1");
  });

  afterEach(() => {
    setUrl("/loan-sim");
  });

  it("personas vacío → retorna null sin renderizar el panel", () => {
    const { container } = renderWithRouter(
      <TestSimuladorPanel personas={[]} onSelectPersona={() => {}} />,
      "/loan-sim?testMode=1",
    );
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId("test-simulador-panel")).toBeNull();
  });

  it("con personas y ?testMode=1 → renderiza un botón por persona con su label", () => {
    renderWithRouter(
      <TestSimuladorPanel
        personas={[
          { id: "SIM_HAPPY", label: "Happy Path", descripcion: "Flow completo" },
        ]}
        onSelectPersona={() => {}}
      />,
      "/loan-sim?testMode=1",
    );

    const panel = screen.getByTestId("test-simulador-panel");
    expect(panel).toBeInTheDocument();

    const button = screen.getByRole("button", { name: /happy path/i });
    expect(button).toBeInTheDocument();
  });

  it("click en un botón de persona → llama onSelectPersona con el id de esa persona", () => {
    const onSelectPersona = vi.fn();
    renderWithRouter(
      <TestSimuladorPanel
        personas={[
          { id: "SIM_HAPPY", label: "Happy Path", descripcion: "Flow completo" },
        ]}
        onSelectPersona={onSelectPersona}
      />,
      "/loan-sim?testMode=1",
    );

    fireEvent.click(screen.getByRole("button", { name: /happy path/i }));
    expect(onSelectPersona).toHaveBeenCalledTimes(1);
    expect(onSelectPersona).toHaveBeenCalledWith("SIM_HAPPY");
  });

  it("loading=true → retorna null aunque haya personas y ?testMode=1", () => {
    // El padre (useTestSimuladorPanel, ver Task 0.6.1) probablemente ni
    // monta el panel durante el fetch inicial, pero el componente también
    // debe gatear solo, para no parpadear entre estados.
    const { container } = renderWithRouter(
      <TestSimuladorPanel
        personas={[
          { id: "SIM_HAPPY", label: "Happy Path", descripcion: "Flow completo" },
        ]}
        onSelectPersona={() => {}}
        loading={true}
      />,
      "/loan-sim?testMode=1",
    );
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId("test-simulador-panel")).toBeNull();
  });

  it("renderiza el botón 'Validar CBU' sólo para la persona del escenario de CBU manual", () => {
    renderWithRouter(
      <TestSimuladorPanel
        personas={[
          { id: "SIM_HAPPY", label: "Happy Path", descripcion: "Flow completo" },
          { id: "SIM_CBU_PENDING", label: "Laura — CBU pendiente" },
        ]}
        onSelectPersona={() => {}}
        onAprobarCbu={() => {}}
      />,
      "/loan-sim?testMode=1",
    );

    expect(screen.getAllByTestId("test-simulador-panel-aprobar-cbu")).toHaveLength(1);
    expect(screen.getByTestId("test-simulador-panel-aprobar-cbu")).toHaveTextContent(
      "Validar CBU",
    );
  });

  // El panel decide mirando `result.success` (el back responde HTTP 200
  // para "aprobo" y para "no habia nada pendiente"), NO con un catch: el
  // boton tiene que poder mostrar el mensaje del back.
  it("click en 'Validar CBU' → llama onAprobarCbu con el id de la persona", () => {
    const onAprobarCbu = vi.fn();
    renderWithRouter(
      <TestSimuladorPanel
        personas={[{ id: "SIM_CBU_PENDING", label: "Laura — CBU pendiente" }]}
        onSelectPersona={() => {}}
        onAprobarCbu={onAprobarCbu}
      />,
      "/loan-sim?testMode=1",
    );

    fireEvent.click(screen.getByTestId("test-simulador-panel-aprobar-cbu"));
    expect(onAprobarCbu).toHaveBeenCalledTimes(1);
    expect(onAprobarCbu).toHaveBeenCalledWith("SIM_CBU_PENDING");
  });

  it("con el CBU ya validado → el botón muestra el estado y queda deshabilitado", () => {
    renderWithRouter(
      <TestSimuladorPanel
        personas={[{ id: "SIM_CBU_PENDING", label: "Laura — CBU pendiente" }]}
        onSelectPersona={() => {}}
        onAprobarCbu={() => {}}
        cbuAprobadoPara="SIM_CBU_PENDING"
      />,
      "/loan-sim?testMode=1",
    );

    const button = screen.getByTestId("test-simulador-panel-aprobar-cbu");
    expect(button).toHaveTextContent("CBU validado");
    expect(button).toBeDisabled();
    // El nombre accesible tiene que contener el texto visible (WCAG 2.5.3):
    // si anunciara "Validar CBU" describiría como accionable un botón ya
    // aplicado.
    expect(button).toHaveAttribute("aria-label", "CBU validado");
  });

  it("con loading → el botón conserva el nombre accesible (aria-label)", () => {
    renderWithRouter(
      <TestSimuladorPanel
        personas={[{ id: "SIM_CBU_PENDING", label: "Laura — CBU pendiente" }]}
        onSelectPersona={() => {}}
        onAprobarCbu={() => {}}
        approvingCbu="SIM_CBU_PENDING"
      />,
      "/loan-sim?testMode=1",
    );

    const button = screen.getByTestId("test-simulador-panel-aprobar-cbu");
    expect(button).toHaveAttribute("aria-label", "Validar CBU");
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});
