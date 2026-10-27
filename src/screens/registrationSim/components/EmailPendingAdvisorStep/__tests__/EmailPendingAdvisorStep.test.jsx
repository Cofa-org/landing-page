// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EmailPendingAdvisorStep from "../EmailPendingAdvisorStep.jsx";

describe("EmailPendingAdvisorStep (Plan 2026-10-09)", () => {
  it("renders text mentioning the advisor (title, body, or button)", () => {
    render(<EmailPendingAdvisorStep onContactAdvisor={() => {}} onVerificarEstado={() => {}} />);
    // The word "asesor" appears in multiple places by design (title, body,
    // button label), so use getAllByText rather than getByText.
    expect(screen.getAllByText(/asesor/i).length).toBeGreaterThanOrEqual(1);
  });

  it("renders the 'Hablar con un asesor' button", () => {
    render(<EmailPendingAdvisorStep onContactAdvisor={() => {}} onVerificarEstado={() => {}} />);
    const button = screen.getByRole("button", {
      name: /hablar con un asesor/i,
    });
    expect(button).toBeInTheDocument();
  });

  it("calls onContactAdvisor exactly once when the button is clicked", () => {
    const onContactAdvisor = vi.fn();
    render(<EmailPendingAdvisorStep onContactAdvisor={onContactAdvisor} onVerificarEstado={() => {}} />);
    fireEvent.click(
      screen.getByRole("button", { name: /hablar con un asesor/i }),
    );
    expect(onContactAdvisor).toHaveBeenCalledTimes(1);
  });

  it("exposes an h2 heading with an accessible name that mentions the advisor", () => {
    render(<EmailPendingAdvisorStep onContactAdvisor={() => {}} onVerificarEstado={() => {}} />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveAccessibleName(/asesor/i);
  });

  it("exposes the action button via data-testid for downstream wiring", () => {
    render(<EmailPendingAdvisorStep onContactAdvisor={() => {}} onVerificarEstado={() => {}} />);
    expect(
      screen.getByTestId("email-pending-advisor-contact-button"),
    ).toBeInTheDocument();
  });
  it("verifies on demand", () => {
    const onVerificarEstado = vi.fn();
    render(<EmailPendingAdvisorStep onContactAdvisor={() => {}} onVerificarEstado={onVerificarEstado} />);
    const button = screen.getByRole("button", { name: "Verificar estado" });
    expect(button).toBeEnabled();
    expect(button).toHaveAttribute("data-testid", "email-pending-advisor-verificar-button");
    fireEvent.click(button);
    expect(onVerificarEstado).toHaveBeenCalledTimes(1);
  });

  it("keeps verification named and disabled during loading while advisor stays usable", () => {
    const onVerificarEstado = vi.fn();
    const onContactAdvisor = vi.fn();
    render(<EmailPendingAdvisorStep onContactAdvisor={onContactAdvisor} onVerificarEstado={onVerificarEstado} loading />);
    const button = screen.getByRole("button", { name: "Verificar estado" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    fireEvent.click(button);
    expect(onVerificarEstado).not.toHaveBeenCalled();
    const advisorButton = screen.getByRole("button", { name: /hablar con un asesor/i });
    expect(advisorButton).toBeEnabled();
    fireEvent.click(advisorButton);
    expect(onContactAdvisor).toHaveBeenCalledTimes(1);
  });

  it("announces recoverable errors only when provided", () => {
    const { rerender } = render(<EmailPendingAdvisorStep onContactAdvisor={() => {}} onVerificarEstado={() => {}} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    rerender(<EmailPendingAdvisorStep onContactAdvisor={() => {}} onVerificarEstado={() => {}} error="No pudimos verificar el estado de tu solicitud. Volvé a intentarlo." />);
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos verificar el estado de tu solicitud. Volvé a intentarlo.");
    expect(screen.getByRole("button", { name: "Verificar estado" })).toBeEnabled();
  });

  it("announces pending status only when provided", () => {
    const { rerender } = render(<EmailPendingAdvisorStep onContactAdvisor={() => {}} onVerificarEstado={() => {}} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    rerender(<EmailPendingAdvisorStep onContactAdvisor={() => {}} onVerificarEstado={() => {}} status="Tu correo todavía está pendiente de actualización. Hablá con un asesor para continuar." />);
    expect(screen.getByRole("status")).toHaveTextContent("Tu correo todavía está pendiente de actualización. Hablá con un asesor para continuar.");
  });
});