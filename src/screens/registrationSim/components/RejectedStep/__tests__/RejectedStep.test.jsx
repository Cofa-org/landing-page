// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RejectedStep from "../RejectedStep.jsx";

describe("RejectedStep", () => {
  it("renderiza el mensaje base sin línea de fecha si no se pasa prop", () => {
    render(<RejectedStep />);
    expect(
      screen.getByText(/Pero seguiremos buscando alternativas/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Podés volver a intentarlo a partir del/),
    ).not.toBeInTheDocument();
  });

  it("renderiza la fecha formateada DD/MM/YYYY cuando se pasa fecha_expiracion_bloqueo", () => {
    render(<RejectedStep fechaExpiracionBloqueo="2026-09-25T10:00:00.000Z" />);
    expect(screen.getByText(/25\/09\/2026/)).toBeInTheDocument();
  });

  it("no crashea cuando la fecha es ISO malformado (oculta la línea de fecha)", () => {
    render(<RejectedStep fechaExpiracionBloqueo="invalid" />);
    expect(
      screen.queryByText(/Podés volver a intentarlo a partir del/),
    ).not.toBeInTheDocument();
  });

  it("renderiza link al home", () => {
    render(<RejectedStep />);
    expect(screen.getByRole("link", { name: /Volver al inicio/i })).toBeInTheDocument();
  });
});
