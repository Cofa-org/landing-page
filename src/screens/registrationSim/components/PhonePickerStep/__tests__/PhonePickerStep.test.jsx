// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PhonePickerStep from "../PhonePickerStep.jsx";

describe("PhonePickerStep", () => {
  it("renderiza 4 botones con el número formateado", () => {
    render(
      <PhonePickerStep
        options={["1144445555", "1144446666", "2214999888", "2614778899"]}
        onPick={vi.fn()}
        loading={false}
        error={null}
      />,
    );

    const buttons = screen.getAllByRole("button").filter((b) =>
      b.getAttribute("data-testid")?.startsWith("phone-picker-option-"),
    );
    expect(buttons).toHaveLength(4);
    expect(screen.getByTestId("phone-picker-option-1144445555")).toBeInTheDocument();
    expect(screen.getByText(/11 4444-5555|1144445555/)).toBeInTheDocument();
  });

  it("click en opción → llama onPick con el valor exacto", () => {
    const onPick = vi.fn();
    render(
      <PhonePickerStep
        options={["1144445555", "1144446666", "2214999888", "2614778899"]}
        onPick={onPick}
        loading={false}
        error={null}
      />,
    );

    fireEvent.click(screen.getByTestId("phone-picker-option-1144445555"));
    expect(onPick).toHaveBeenCalledWith("1144445555");
  });

  it("loading=true → los 4 botones están disabled (aria-busy=true)", () => {
    render(
      <PhonePickerStep
        options={["1144445555", "1144446666", "2214999888", "2614778899"]}
        onPick={vi.fn()}
        loading={true}
        error={null}
      />,
    );

    const buttons = screen
      .getAllByRole("button")
      .filter((b) => b.getAttribute("data-testid")?.startsWith("phone-picker-option-"));
    expect(buttons.every((b) => b.hasAttribute("disabled"))).toBe(true);
  });

  it("error no nulo → muestra role=alert con el mensaje", () => {
    render(
      <PhonePickerStep
        options={["1144445555", "1144446666", "2214999888", "2614778899"]}
        onPick={vi.fn()}
        loading={false}
        error={"Ya intentaste con este método."}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(/ya intentaste/i);
  });

  it("acepta exactamente 4 options; con 3 → warning console.error y null render", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = render(
      <PhonePickerStep
        options={["1", "2", "3"]}
        onPick={vi.fn()}
        loading={false}
        error={null}
      />,
    );

    expect(consoleSpy).toHaveBeenCalled();
    expect(container.firstChild).toBeNull();
    consoleSpy.mockRestore();
  });
});
