// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
vi.mock("../../../../services/testPersonasService.js", () => ({ fetchTestPersonas: vi.fn(), resetPersonaEmail: vi.fn(), setPersonaEmail: vi.fn() }));
import { fetchTestPersonas, resetPersonaEmail, setPersonaEmail } from "../../../../services/testPersonasService.js";
import { useTestPersonasPanel } from "../useTestPersonasPanel.js";
const wrapper = ({ children }) => <MemoryRouter initialEntries={["/registro?testPersona=CARLOS_NO_EMAIL&keep=1"]}>{children}</MemoryRouter>;
const renderPanelHook = () => renderHook(() => ({ ...useTestPersonasPanel(), location: useLocation() }), { wrapper });
describe("useTestPersonasPanel email actions", () => {
  let reloadSpy;
  beforeEach(() => {
    vi.clearAllMocks();
    fetchTestPersonas.mockResolvedValue([]);
    reloadSpy = vi.fn();
    Object.defineProperty(window, "location", { configurable: true, value: { ...window.location, reload: reloadSpy } });
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());
  it("adds email without reload or navigation and blocks completed duplicates", async () => {
    setPersonaEmail.mockResolvedValue({ success: true, personaId: "CARLOS_NO_EMAIL", email: "carlos@test.com" });
    const { result } = renderPanelHook();
    await act(async () => { await result.current.addEmail("CARLOS_NO_EMAIL"); });
    expect(result.current.emailStatusByPersona.CARLOS_NO_EMAIL).toBe("added");
    await act(async () => { await result.current.addEmail("CARLOS_NO_EMAIL"); });
    expect(setPersonaEmail).toHaveBeenCalledExactlyOnceWith("CARLOS_NO_EMAIL");
    expect(reloadSpy).not.toHaveBeenCalled();
    expect(result.current.location.pathname).toBe("/registro");
    expect(result.current.location.search).toBe("?testPersona=CARLOS_NO_EMAIL&keep=1");
  });
  it("blocks same-tick duplicates while allowing independent personas", async () => {
    let resolveCarlos;
    setPersonaEmail.mockImplementation((id) => id === "CARLOS_NO_EMAIL" ? new Promise(resolve => { resolveCarlos = resolve; }) : Promise.resolve({ success: true }));
    const { result } = renderPanelHook();
    let pending;
    act(() => { pending = result.current.addEmail("CARLOS_NO_EMAIL"); result.current.addEmail("CARLOS_NO_EMAIL"); });
    expect(result.current.emailStatusByPersona.CARLOS_NO_EMAIL).toBe("loading");
    expect(setPersonaEmail).toHaveBeenCalledTimes(1);
    await act(async () => { await result.current.addEmail("OTHER"); });
    expect(result.current.emailStatusByPersona.OTHER).toBe("added");
    expect(result.current.emailStatusByPersona.CARLOS_NO_EMAIL).toBe("loading");
    await act(async () => { resolveCarlos({ success: true }); await pending; });
    expect(result.current.emailStatusByPersona.CARLOS_NO_EMAIL).toBe("added");
  });
  it.each([new Error("network down"), { success: false }])("leaves failed additions retryable: %s", async (failure) => {
    if (failure instanceof Error) setPersonaEmail.mockRejectedValueOnce(failure);
    else setPersonaEmail.mockResolvedValueOnce(failure);
    setPersonaEmail.mockResolvedValueOnce({ success: true });
    const { result } = renderPanelHook();
    await act(async () => { await result.current.addEmail("CARLOS_NO_EMAIL"); });
    expect(result.current.emailStatusByPersona.CARLOS_NO_EMAIL).toBeUndefined();
    expect(window.alert).toHaveBeenCalledWith(expect.stringMatching(/No se pudo agregar el email/));
    await act(async () => { await result.current.addEmail("CARLOS_NO_EMAIL"); });
    expect(result.current.emailStatusByPersona.CARLOS_NO_EMAIL).toBe("added");
    expect(setPersonaEmail).toHaveBeenCalledTimes(2);
    expect(reloadSpy).not.toHaveBeenCalled();
  });
  it("resets persona email and clears session and query before reloading", async () => {
    resetPersonaEmail.mockImplementation(async () => { expect(reloadSpy).not.toHaveBeenCalled(); return { success: true }; });
    document.cookie = "leadToken=test; path=/";
    const { result } = renderPanelHook();
    await act(async () => { await result.current.resetSession(); });
    expect(resetPersonaEmail).toHaveBeenCalledExactlyOnceWith("CARLOS_NO_EMAIL");
    expect(document.cookie).not.toContain("leadToken=");
    expect(result.current.location.search).toBe("");
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });
});
