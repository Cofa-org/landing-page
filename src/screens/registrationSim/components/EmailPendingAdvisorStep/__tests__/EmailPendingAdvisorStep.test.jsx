// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EmailPendingAdvisorStep from "../EmailPendingAdvisorStep.jsx";

describe("EmailPendingAdvisorStep (Plan 2026-10-09)", () => {
  it("renders text mentioning the advisor (title, body, or button)", () => {
    render(<EmailPendingAdvisorStep onContactAdvisor={() => {}} />);
    // The word "asesor" appears in multiple places by design (title, body,
    // button label), so use getAllByText rather than getByText.
    expect(screen.getAllByText(/asesor/i).length).toBeGreaterThanOrEqual(1);
  });

  it("renders the 'Comunicarse con un asesor' button", () => {
    render(<EmailPendingAdvisorStep onContactAdvisor={() => {}} />);
    const button = screen.getByRole("button", {
      name: /comunicarse con un asesor/i,
    });
    expect(button).toBeInTheDocument();
  });

  it("calls onContactAdvisor exactly once when the button is clicked", () => {
    const onContactAdvisor = vi.fn();
    render(<EmailPendingAdvisorStep onContactAdvisor={onContactAdvisor} />);
    fireEvent.click(
      screen.getByRole("button", { name: /comunicarse con un asesor/i }),
    );
    expect(onContactAdvisor).toHaveBeenCalledTimes(1);
  });

  it("exposes an h2 heading with an accessible name that mentions the advisor", () => {
    render(<EmailPendingAdvisorStep onContactAdvisor={() => {}} />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveAccessibleName(/asesor/i);
  });

  it("exposes the action button via data-testid for downstream wiring", () => {
    render(<EmailPendingAdvisorStep onContactAdvisor={() => {}} />);
    expect(
      screen.getByTestId("email-pending-advisor-contact-button"),
    ).toBeInTheDocument();
  });
});
