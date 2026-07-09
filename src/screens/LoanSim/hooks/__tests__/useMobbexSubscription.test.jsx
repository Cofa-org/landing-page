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
      sid: null,
      uid: null,
      status: null,
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

  test("handleSuscribirse llama solicitarSuscripcionMobbex con linkId y redirige", async () => {
    SimuladorService.solicitarSuscripcionMobbex.mockResolvedValue({
      success: true,
      data: { subscriptionURL: "https://mobbex.com/p/test" },
    });
    const { result } = renderHook(() => useMobbexSubscription("abc123", vi.fn()), {
      wrapper: makeWrapper("/simulador?id=eSQKz2X1ds"),
    });

    await act(async () => {
      await result.current.handleSuscribirse();
    });

    expect(SimuladorService.solicitarSuscripcionMobbex).toHaveBeenCalledWith({
      scoringId: "abc123",
      linkId: "eSQKz2X1ds",
    });
    expect(window.location.href).toBe("https://mobbex.com/p/test");
  });

  test("handleSuscribirse setea error si la API falla", async () => {
    SimuladorService.solicitarSuscripcionMobbex.mockRejectedValue(new Error("Network"));
    const { result } = renderHook(() => useMobbexSubscription("abc123", vi.fn()), {
      wrapper: makeWrapper("/simulador?id=eSQKz2X1ds"),
    });

    await act(async () => {
      await result.current.handleSuscribirse();
    });

    expect(result.current.error).toBe("Network");
    expect(window.location.href).toBe("");
  });

  test("con fromMobbex=true y sid/uid/status en URL, llama confirmar con esos params", async () => {
    SimuladorService.confirmarSuscripcionMobbex.mockResolvedValue({ success: true });
    const onCompleted = vi.fn();

    renderHook(() => useMobbexSubscription("abc123", onCompleted), {
      wrapper: makeWrapper(
        "/simulador?fromMobbex=true&sid=SID123&uid=UID456&status=200",
      ),
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(SimuladorService.confirmarSuscripcionMobbex).toHaveBeenCalledWith({
      scoringId: "abc123",
      sid: "SID123",
      uid: "UID456",
      status: "200",
    });
    expect(onCompleted).toHaveBeenCalled();
  });

  test("con fromMobbex=true y success=false: NO llama onCompleted y setea error", async () => {
    SimuladorService.confirmarSuscripcionMobbex.mockResolvedValue({
      success: false,
      message: "No se pudo persistir la firma",
    });
    const onCompleted = vi.fn();

    const { result } = renderHook(() => useMobbexSubscription("abc123", onCompleted), {
      wrapper: makeWrapper("/simulador?fromMobbex=true"),
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(onCompleted).not.toHaveBeenCalled();
    expect(result.current.error).toBe("No se pudo persistir la firma 😕");
  });

  test("handleSuscribirse con success=false: setea error y NO redirige", async () => {
    SimuladorService.solicitarSuscripcionMobbex.mockResolvedValue({
      success: false,
      message: "El linkId no es válido",
    });
    const { result } = renderHook(() => useMobbexSubscription("abc123", vi.fn()), {
      wrapper: makeWrapper("/simulador?id=eSQKz2X1ds"),
    });

    await act(async () => {
      await result.current.handleSuscribirse();
    });

    expect(result.current.error).toBe("El linkId no es válido 😕");
    expect(window.location.href).toBe("");
  });
});
