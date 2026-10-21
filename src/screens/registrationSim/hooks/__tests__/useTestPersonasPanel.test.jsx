// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mockeamos el service ANTES de importar el hook bajo test.
vi.mock("../../../../services/testPersonasService.js", () => ({
  fetchTestPersonas: vi.fn(),
  resetPersonaEmail: vi.fn(),
}));

import { fetchTestPersonas, resetPersonaEmail } from "../../../../services/testPersonasService.js";
import { useTestPersonasPanel } from "../useTestPersonasPanel.js";

const makeWrapper = (initialUrl = "/registro") =>
  ({ children }) => <MemoryRouter initialEntries={[initialUrl]}>{children}</MemoryRouter>;

describe("useTestPersonasPanel — resetSession extendido", () => {
  let reloadSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchTestPersonas.mockResolvedValue([]);
    reloadSpy = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, reload: reloadSpy },
    });
  });

  it("resetSession() → llama resetPersonaEmail('CARLOS_NO_EMAIL') antes de recargar (invariante: email siempre vacío al empezar el caso)", async () => {
    resetPersonaEmail.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useTestPersonasPanel(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.resetSession();
    });

    expect(resetPersonaEmail).toHaveBeenCalledTimes(1);
    expect(resetPersonaEmail).toHaveBeenCalledWith("CARLOS_NO_EMAIL");
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });
});
