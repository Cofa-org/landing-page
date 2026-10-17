// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mockeamos el hook Y el service ANTES de importar el componente bajo test.
// (vi.mock se eleva por hoist del bundler, así que la importación del
// componente más abajo siempre encuentra los mocks.)
vi.mock("../../../hooks/useTestPersonasPanel.js", () => ({
  useTestPersonasPanel: vi.fn(),
  // El componente también importa `PERSONAS_CON_AGREGAR_EMAIL` para decidir
  // qué botón renderizar. Devolvemos el Set real (no lo mockeamos: el test
  // lo necesita truthy para que el botón "Agregar email" aparezca).
  PERSONAS_CON_AGREGAR_EMAIL: new Set(["CARLOS_NO_EMAIL"]),
}));

vi.mock("../../../../../services/testPersonasService.js", () => ({
  setPersonaEmail: vi.fn(),
  resetPersonaEmail: vi.fn(),
}));

// Forzamos que el panel sea visible (gate: DEV || ?testMode=1).
// En Vitest DEV=true siempre, así que el panel se ve sin tocar search.
vi.mock("../../../../../config.js", () => ({
  isTestPersonasVisible: vi.fn(() => true),
}));

import { useTestPersonasPanel } from "../../../hooks/useTestPersonasPanel.js";
import { setPersonaEmail, resetPersonaEmail } from "../../../../../services/testPersonasService.js";
import TestPersonasPanel from "../TestPersonasPanel.jsx";

const renderWithRouter = (ui, initialUrl = "/registro") =>
  render(<MemoryRouter initialEntries={[initialUrl]}>{ui}</MemoryRouter>);

const baseHookReturn = (overrides = {}) => ({
  collapsed: false,
  setCollapsed: vi.fn(),
  personas: [],
  activePersonaId: null,
  selectPersona: vi.fn(),
  resetSession: vi.fn(),
  ...overrides,
});

describe("TestPersonasPanel — botón 'Agregar email'", () => {
  let reloadSpy;
  let alertSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    // Evitar que window.location.reload dispare el jsdom navigation.
    reloadSpy = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, reload: reloadSpy },
    });
    alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it("renderiza el botón '✉️ Agregar email' SOLO para CARLOS_NO_EMAIL, no para otras personas", () => {
    useTestPersonasPanel.mockReturnValue(
      baseHookReturn({
        personas: [
          { id: "REG_HAPPY", label: "Registro Happy", descripcion: "Flow completo" },
          { id: "CARLOS_NO_EMAIL", label: "Carlos sin email", descripcion: "Sin email" },
          { id: "OTRO", label: "Otro", descripcion: "Otro flow" },
        ],
      }),
    );

    renderWithRouter(<TestPersonasPanel />);

    const addEmailButtons = screen.getAllByTestId("test-personas-add-email-button");
    expect(addEmailButtons).toHaveLength(1);
    expect(addEmailButtons[0]).toHaveTextContent(/agregar email/i);

    // El botón debe estar dentro del <li> de CARLOS_NO_EMAIL — verificamos
    // buscando por el nombre de la persona.
    const carlosItem = screen.getByText(/carlos sin email/i).closest("li");
    expect(carlosItem).not.toBeNull();
    expect(carlosItem.querySelector('[data-testid="test-personas-add-email-button"]')).not.toBeNull();

    // REG_HAPPY y OTRO NO deben tener el botón dentro de su <li>.
    const regHappyItem = screen.getByText(/registro happy/i).closest("li");
    expect(regHappyItem.querySelector('[data-testid="test-personas-add-email-button"]')).toBeNull();
    const otroItem = screen.getByText(/^otro$/i).closest("li");
    expect(otroItem.querySelector('[data-testid="test-personas-add-email-button"]')).toBeNull();
  });

  it("click en 'Agregar email' → llama setPersonaEmail con el personaId y recarga la página", async () => {
    setPersonaEmail.mockResolvedValueOnce({ success: true });

    useTestPersonasPanel.mockReturnValue(
      baseHookReturn({
        personas: [
          { id: "CARLOS_NO_EMAIL", label: "Carlos sin email", descripcion: "Sin email" },
        ],
      }),
    );

    renderWithRouter(<TestPersonasPanel />);

    const addEmailBtn = screen.getByTestId("test-personas-add-email-button");
    fireEvent.click(addEmailBtn);

    await waitFor(() => {
      expect(setPersonaEmail).toHaveBeenCalledTimes(1);
    });
    expect(setPersonaEmail).toHaveBeenCalledWith("CARLOS_NO_EMAIL");
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it("click con error → alert con el mensaje y NO recarga", async () => {
    setPersonaEmail.mockRejectedValueOnce(new Error("network down"));

    useTestPersonasPanel.mockReturnValue(
      baseHookReturn({
        personas: [
          { id: "CARLOS_NO_EMAIL", label: "Carlos sin email", descripcion: "Sin email" },
        ],
      }),
    );

    renderWithRouter(<TestPersonasPanel />);

    const addEmailBtn = screen.getByTestId("test-personas-add-email-button");
    fireEvent.click(addEmailBtn);

    await waitFor(() => {
      expect(setPersonaEmail).toHaveBeenCalledTimes(1);
    });
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledWith(expect.stringMatching(/network down/));
    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it("panel colapsado → no renderiza el botón 'Agregar email'", () => {
    useTestPersonasPanel.mockReturnValue(
      baseHookReturn({
        collapsed: true,
        personas: [
          { id: "CARLOS_NO_EMAIL", label: "Carlos sin email", descripcion: "Sin email" },
        ],
      }),
    );

    renderWithRouter(<TestPersonasPanel />);

    // El panel sigue visible (data-testid existe) pero la lista está colapsada.
    expect(screen.getByTestId("test-personas-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("test-personas-add-email-button")).toBeNull();
  });
});
