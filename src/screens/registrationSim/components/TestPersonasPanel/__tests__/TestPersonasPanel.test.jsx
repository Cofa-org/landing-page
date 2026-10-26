// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
vi.mock("../../../../../services/testPersonasService.js", () => ({ fetchTestPersonas: vi.fn(), setPersonaEmail: vi.fn(), resetPersonaEmail: vi.fn() }));
vi.mock("../../../../../config.js", () => ({ isTestPersonasVisible: () => true }));
import { fetchTestPersonas, setPersonaEmail } from "../../../../../services/testPersonasService.js";
import TestPersonasPanel from "../TestPersonasPanel.jsx";
const Location = () => { const location = useLocation(); return <output data-testid="location">{location.pathname}{location.search}</output>; };
const renderPanel = () => render(<MemoryRouter initialEntries={["/registro?testPersona=CARLOS_NO_EMAIL"]}><TestPersonasPanel /><Location /></MemoryRouter>);
describe("TestPersonasPanel add email", () => {
  let reloadSpy;
  beforeEach(() => {
    vi.clearAllMocks();
    fetchTestPersonas.mockResolvedValue([{ id: "CARLOS_NO_EMAIL", label: "Carlos sin email", useCases: ["registro"] }, { id: "REG_HAPPY", label: "Registro Happy", useCases: ["registro"] }]);
    reloadSpy = vi.fn();
    Object.defineProperty(window, "location", { configurable: true, value: { ...window.location, reload: reloadSpy } });
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());
  it("shows add email only on supported personas and hides it when collapsed", async () => {
    renderPanel();
    const button = await screen.findByRole("button", { name: /agregar email/i });
    expect(screen.getAllByTestId("test-personas-add-email-button")).toHaveLength(1);
    expect(button.closest("li")).toHaveTextContent("Carlos sin email");
    fireEvent.click(screen.getByRole("button", { name: "Ocultar" }));
    expect(screen.queryByTestId("test-personas-add-email-button")).toBeNull();
  });
  it("keeps the current route while loading, then shows disabled Email agregado", async () => {
    let resolveEmail;
    setPersonaEmail.mockReturnValue(new Promise(resolve => { resolveEmail = resolve; }));
    renderPanel();
    const button = await screen.findByRole("button", { name: /agregar email/i });
    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    fireEvent.click(button);
    expect(setPersonaEmail).toHaveBeenCalledExactlyOnceWith("CARLOS_NO_EMAIL");
    await act(async () => { resolveEmail({ success: true, personaId: "CARLOS_NO_EMAIL", email: "carlos@test.com" }); });
    expect(screen.getByRole("button", { name: "Email agregado" })).toBeDisabled();
    fireEvent.click(button);
    expect(setPersonaEmail).toHaveBeenCalledTimes(1);
    expect(reloadSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId("location")).toHaveTextContent("/registro?testPersona=CARLOS_NO_EMAIL");
  });
  it("shows errors and enables retry", async () => {
    setPersonaEmail.mockRejectedValueOnce(new Error("network down")).mockResolvedValueOnce({ success: true });
    renderPanel();
    fireEvent.click(await screen.findByRole("button", { name: /agregar email/i }));
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("network down")));
    const retry = screen.getByRole("button", { name: /agregar email/i });
    expect(retry).toBeEnabled();
    fireEvent.click(retry);
    expect(await screen.findByRole("button", { name: "Email agregado" })).toBeDisabled();
    expect(reloadSpy).not.toHaveBeenCalled();
  });
});
