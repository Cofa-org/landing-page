// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CBUValidation from "../CBUValidation.jsx";

/**
 * Rama "CBU ya validado por el asesor" (Plan 2026-10-20).
 *
 * No se mockea `GenericButton`: el repo ya tiene tests de componentes
 * hermanos (ver `registrationSim/components/EmailPendingAdvisorStep`)
 * que usan el botón real, y mockearlo escondería justo lo que esta rama
 * necesita garantizar (que el click llegue al `handleSubmit`, que el
 * estado de `loading` deshabilite el botón y que `aria-busy` se exponga).
 */
describe("CBUValidation — CBU ya validado por el asesor (Plan 2026-10-20)", () => {
  it("cuando cbuValidado y hay pendingCbu, muestra el CBU del cliente y el botón Continuar", () => {
    render(
      <CBUValidation
        onValidate={vi.fn()}
        loading={false}
        error={null}
        onBack={vi.fn()}
        isClient
        existingCbu="CBU_DEL_ERP"
        pendingCbu="CBU_DEL_CLIENTE"
        cbuValidado
      />,
    );
    expect(screen.getByTestId("cbu-validation-approved")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tu cuenta fue validada." })).toBeInTheDocument();
    expect(screen.getByText("Confirmamos el CBU/CVU que ingresaste. Presioná “Continuar” para seguir con tu solicitud.")).toBeInTheDocument();
    expect(screen.getByText("CBU_DEL_CLIENTE")).toBeInTheDocument();
    // El CBU del ERP no debe aparecer: el asesor validó el que ingressó el cliente.
    expect(screen.queryByText("CBU_DEL_ERP")).toBeNull();
    expect(screen.getByTestId("cbu-validation-approved-submit")).toBeInTheDocument();
  });

  it("el submit manda el pendingCbu, no el CBU del ERP", () => {
    const onValidate = vi.fn();
    render(
      <CBUValidation
        onValidate={onValidate}
        loading={false}
        error={null}
        onBack={vi.fn()}
        isClient
        existingCbu="CBU_DEL_ERP"
        pendingCbu="CBU_DEL_CLIENTE"
        cbuValidado
      />,
    );
    fireEvent.click(screen.getByTestId("cbu-validation-approved-submit"));
    expect(onValidate).toHaveBeenCalledTimes(1);
    expect(onValidate).toHaveBeenCalledWith("CBU_DEL_CLIENTE", "cbu");
  });

  it("si el pendiente es un CVU, el submit lo manda como cvu", () => {
    const onValidate = vi.fn();
    render(
      <CBUValidation
        onValidate={onValidate}
        loading={false}
        error={null}
        onBack={vi.fn()}
        isClient
        existingCbu="CBU_DEL_ERP"
        pendingCbu="0000000000000000000000"
        pendingAccountType="cvu"
        cbuValidado
      />,
    );
    fireEvent.click(screen.getByTestId("cbu-validation-approved-submit"));
    expect(onValidate).toHaveBeenCalledTimes(1);
    expect(onValidate).toHaveBeenCalledWith("0000000000000000000000", "cvu");
  });

  it("cbuValidado=true pero pendingCbu=null → NO muestra la rama de aprobado y el flujo normal sigue funcionando", () => {
    const onValidate = vi.fn();
    render(
      <CBUValidation
        onValidate={onValidate}
        loading={false}
        error={null}
        onBack={vi.fn()}
        isClient
        existingCbu="CBU_DEL_ERP"
        pendingCbu={null}
        cbuValidado
      />,
    );

    // Sin cuenta pendiente no hay nada aprobado que mostrar: el gate es el PAR
    // (`cbuValidado && pendingCbu`), no el flag solo.
    expect(screen.queryByTestId("cbu-validation-approved")).toBeNull();

    // Y el flujo normal no puede quedar como no-op silencioso: el gate del
    // hook tiene que ser el mismo PAR, si no "Sí, es correcto" no hace nada.
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Sí, es correcto" }));
    expect(onValidate).toHaveBeenCalledWith("CBU_DEL_ERP", "cbu");
  });

  it("sin cbuValidado, la pantalla NO muestra la rama de aprobado", () => {
    render(
      <CBUValidation
        onValidate={vi.fn()}
        loading={false}
        error={null}
        onBack={vi.fn()}
        isClient
        existingCbu="CBU_DEL_ERP"
        pendingCbu="CBU_DEL_CLIENTE"
        cbuValidado={false}
      />,
    );
    expect(screen.queryByTestId("cbu-validation-approved")).toBeNull();
  });

  it("sin cbuValidado, el flujo normal sigue funcionando: 'Sí, es correcto' manda el CBU del ERP", () => {
    const onValidate = vi.fn();
    render(
      <CBUValidation
        onValidate={onValidate}
        loading={false}
        error={null}
        onBack={vi.fn()}
        isClient
        existingCbu="CBU_DEL_ERP"
        pendingCbu="CBU_DEL_CLIENTE"
        cbuValidado={false}
      />,
    );
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Sí, es correcto" }));
    expect(onValidate).toHaveBeenCalledTimes(1);
    expect(onValidate).toHaveBeenCalledWith("CBU_DEL_ERP", "cbu");
  });

  it("con loading, el botón Continuar queda deshabilitado y marcado como ocupado", () => {
    render(
      <CBUValidation
        onValidate={vi.fn()}
        loading
        error={null}
        onBack={vi.fn()}
        isClient
        existingCbu="CBU_DEL_ERP"
        pendingCbu="CBU_DEL_CLIENTE"
        cbuValidado
      />,
    );
    const submitButton = screen.getByTestId("cbu-validation-approved-submit");
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveAttribute("aria-busy", "true");
  });
});
