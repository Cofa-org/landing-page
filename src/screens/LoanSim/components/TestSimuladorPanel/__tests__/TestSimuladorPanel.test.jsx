// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TestSimuladorPanel from "../TestSimuladorPanel.jsx";

/**
 * Wrap under test in MemoryRouter so `useSearchParams` (called by the panel)
 * can read the URL's query string.
 *
 * IMPORTANTE — sobre `import.meta.env.DEV`:
 * Vite reemplaza `import.meta.env.DEV` por un literal `true`/`false` al
 * transformar el módulo. En Vitest ese modo es "test" → DEV=true SIEMPRE,
 * sin override runtime posible (ni `vi.stubEnv('DEV', 'false')` lo cambia).
 * Por eso el branch "DEV=false → null" NO es unit-testeable desde acá: es
 * una **garantía de build-time del plugin de Vite**. La cobertura real de
 * ese gate sale del smoke test manual contra `vite build` (production).
 *
 * Estos tests cubren los behaviours runtime-testeables: el gate de personas
 * vacías, el render positivo con `?testMode=1`, y el callback onSelect.
 */
const renderWithRouter = (ui, initialUrl = "/loan-sim") =>
  render(<MemoryRouter initialEntries={[initialUrl]}>{ui}</MemoryRouter>);

describe("TestSimuladorPanel", () => {
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
});
