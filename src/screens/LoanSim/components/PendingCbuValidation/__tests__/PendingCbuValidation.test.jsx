// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PendingCbuValidation from "../PendingCbuValidation.jsx";

// No se mockea `GenericButton` (misma convención que
// `registrationSim/components/EmailPendingAdvisorStep/__tests__`): el botón
// real es el que reemplaza el label por el spinner en estado loading, y
// eso es justamente lo que hay que verificar acá.
describe("PendingCbuValidation (Plan 2026-10-20)", () => {
  it("renderiza el título de la pantalla", () => {
    render(<PendingCbuValidation onContactAdvisor={vi.fn()} onVerificarEstado={vi.fn()} />);
    expect(screen.getByTestId("pending-cbu-validation")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Necesitamos revisar tu nueva cuenta" })).toBeInTheDocument();
    expect(screen.getByText("Hablá con un asesor para revisar el CBU/CVU que ingresaste. Cuando te confirme que podés continuar, presioná “Verificar estado”")).toBeInTheDocument();
  });

  it("renderiza el botón de comunicación con el asesor", () => {
    const onContactAdvisor = vi.fn();
    render(<PendingCbuValidation onContactAdvisor={onContactAdvisor} onVerificarEstado={vi.fn()} />);
    const btn = screen.getByTestId("pending-cbu-contact-button");
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAccessibleName("Hablar con un asesor");
    btn.click();
    expect(onContactAdvisor).toHaveBeenCalledTimes(1);
  });

  it("renderiza el botón de verificar estado", () => {
    const onVerificarEstado = vi.fn();
    render(<PendingCbuValidation onContactAdvisor={vi.fn()} onVerificarEstado={onVerificarEstado} />);
    const btn = screen.getByTestId("pending-cbu-verificar-button");
    expect(btn).toBeInTheDocument();
    btn.click();
    expect(onVerificarEstado).toHaveBeenCalledTimes(1);
  });

  it("el botón de verificar estado acepta el estado de loading", () => {
    render(<PendingCbuValidation onContactAdvisor={vi.fn()} onVerificarEstado={vi.fn()} loading />);
    const btn = screen.getByTestId("pending-cbu-verificar-button");
    expect(btn).toBeInTheDocument();
    // Mientras está en loading el botón queda deshabilitado (evita el doble
    // submit) y se marca como ocupado.
    expect(btn.disabled).toBe(true);
    expect(btn.getAttribute("aria-busy")).toBe("true");
    // El nombre accesible no puede perderse cuando `GenericButton`
    // reemplaza el label por el spinner.
    expect(btn).toHaveAccessibleName("Verificar estado");
  });

  // Plan 2026-10-20 (fix final de rama): la pantalla de espera es un
  // dead-end → si el refresh de la simulación falla (el caso más probable
  // es `SIMULADOR_SIMULATION_EXPIRED`, a las 24h) el lead tiene que enterarse.
  it("muestra el error del hook con role=alert", () => {
    const error = "Tu solicitud anterior expiró. Por favor, iniciala nuevamente 😊";
    render(
      <PendingCbuValidation
        onContactAdvisor={vi.fn()}
        onVerificarEstado={vi.fn()}
        error={error}
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(error);
  });

  it("no renderiza el alert cuando no hay error", () => {
    render(<PendingCbuValidation onContactAdvisor={vi.fn()} onVerificarEstado={vi.fn()} />);
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
