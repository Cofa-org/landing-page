import { renderHook, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mocks: declarados ANTES de importar el hook bajo test
vi.mock("../../../../services/simuladorService.js", () => ({
  __esModule: true,
  default: {
    solicitarSuscripcionMobbex: vi.fn(),
    confirmarSuscripcionMobbex: vi.fn(),
  },
}));

import SimuladorService from "../../../../services/simuladorService.js";
import { useMobbexSubscription } from "../useMobbexSubscription";

// Mock window.location
delete window.location;
window.location = { href: "" };

const makeWrapper = (initialUrl) => ({ children }) => (
  <MemoryRouter initialEntries={[initialUrl]}>{children}</MemoryRouter>
);

describe("useMobbexSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.href = "";
  });

  test("con fromMobbex=true llama confirmarSuscripcionMobbex en mount y dispara onCompleted", async () => {
    SimuladorService.confirmarSuscripcionMobbex.mockResolvedValue({ success: true });
    const onCompleted = vi.fn();

    renderHook(() => useMobbexSubscription("abc123", onCompleted), {
      wrapper: makeWrapper("/simulador?fromMobbex=true"),
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(SimuladorService.confirmarSuscripcionMobbex).toHaveBeenCalledWith({
      scoringId: "abc123",
    });
    expect(onCompleted).toHaveBeenCalled();
  });

  test("sin fromMobbex NO llama confirmar automáticamente", async () => {
    renderHook(() => useMobbexSubscription("abc123", vi.fn()), {
      wrapper: makeWrapper("/simulador"),
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(SimuladorService.confirmarSuscripcionMobbex).not.toHaveBeenCalled();
  });

  test("handleSuscribirse llama solicitarSuscripcionMobbex y redirige", async () => {
    SimuladorService.solicitarSuscripcionMobbex.mockResolvedValue({
      success: true,
      data: { subscriptionURL: "https://mobbex.com/p/test" },
    });
    const { result } = renderHook(() => useMobbexSubscription("abc123", vi.fn()), {
      wrapper: makeWrapper("/simulador"),
    });

    await act(async () => {
      await result.current.handleSuscribirse();
    });

    expect(SimuladorService.solicitarSuscripcionMobbex).toHaveBeenCalledWith({
      scoringId: "abc123",
    });
    expect(window.location.href).toBe("https://mobbex.com/p/test");
  });

  test("handleSuscribirse setea error si la API falla", async () => {
    SimuladorService.solicitarSuscripcionMobbex.mockRejectedValue(new Error("Network"));
    const { result } = renderHook(() => useMobbexSubscription("abc123", vi.fn()), {
      wrapper: makeWrapper("/simulador"),
    });

    await act(async () => {
      await result.current.handleSuscribirse();
    });

    expect(result.current.error).toBe("Network");
    expect(window.location.href).toBe("");
  });
});
