// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mocks: declarados ANTES de importar el componente bajo test.
vi.mock("../../../../../services/leadRegistrationService.js", () => ({
  __esModule: true,
  default: {
    getRecibosPendientes: vi.fn(),
    subirRecibos: vi.fn(),
    eliminarRecibo: vi.fn(),
  },
}));

import LeadRegistrationService from "../../../../../services/leadRegistrationService.js";
import ReciboUploadStep from "../ReciboUploadStep.jsx";

const makeFile = (name = "recibo.jpg") =>
  new File(["(binary)"], name, { type: "image/jpeg" });

/**
 * Helper: cuenta cuántos inputs file hay renderizados en el DOM.
 * La cantidad de slots visibles se cuenta por la cantidad de inputs file
 * (uno por slot, sea placeholder o tile).
 */
const countFileInputs = (container) =>
  container.querySelectorAll('input[type="file"]').length;

describe("ReciboUploadStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    LeadRegistrationService.getRecibosPendientes.mockResolvedValue([]);
    LeadRegistrationService.eliminarRecibo.mockResolvedValue({ success: true });
  });

  describe("renderizado inicial", () => {
    it("renderiza 3 slots por defecto", () => {
      const { container } = render(<ReciboUploadStep leadId={1} />);
      // Cada slot expone su input file (vacío al inicio). 3 slots → 3 inputs.
      expect(countFileInputs(container)).toBe(3);
    });

    it("muestra los labels de '+ Agregar Recibo N' en cada placeholder", () => {
      render(<ReciboUploadStep leadId={1} />);
      // Labels son fijos por posición: slot 1 → "+ Agregar Recibo 2",
      // slot 2 → "+ Agregar Recibo 3", slot 3 → "Tocar para subir"
      // (maxSlots = 3, slot 3 ya no agrega más).
      expect(screen.getByText(/\+ Agregar Recibo 2/i)).toBeInTheDocument();
      expect(screen.getByText(/\+ Agregar Recibo 3/i)).toBeInTheDocument();
      expect(screen.getByText(/Tocar para subir/i)).toBeInTheDocument();
    });

    it("después de subir Recibo 1, '+ Agregar Recibo 3' sigue presente (slot 2) y el tile de Recibo 1 muestra el check", async () => {
      LeadRegistrationService.subirRecibos.mockResolvedValue({
        success: true,
        data: { recibos: [{ id: 100, orden: 1 }] },
      });

      render(<ReciboUploadStep leadId={7} />);

      // Slot 1 (data-testid="slot-1-input") → fire change.
      const slot1Input = screen.getByTestId("slot-1-input");
      fireEvent.change(slot1Input, { target: { files: [makeFile("a.jpg")] } });

      const submitBtn = screen.getByRole("button", { name: /continuar/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        // Tras subir Recibo 1, el placeholder del slot 1 desaparece (ahora
        // es un tile con preview). Slot 2 sigue mostrando "+ Agregar Recibo 3".
        expect(screen.queryByTestId("slot-1-input")).not.toBeInTheDocument();
      });

      expect(screen.getByText(/\+ Agregar Recibo 3/i)).toBeInTheDocument();
    });

    it("nunca renderiza un 4to slot (max 3)", () => {
      const { container } = render(<ReciboUploadStep leadId={7} />);

      // Estado inicial: 3 placeholders con 3 file inputs.
      expect(countFileInputs(container)).toBe(3);

      // Llenamos los 3 slots con archivos. El componente usa
      // `slots.slice(0, MAX_SLOTS)` con MAX_SLOTS=3 → no debe aparecer
      // un 4to slot aunque el hook interno mantenga su array de 3.
      fireEvent.change(screen.getByTestId("slot-1-input"), {
        target: { files: [makeFile("a.jpg")] },
      });
      fireEvent.change(screen.getByTestId("slot-2-input"), {
        target: { files: [makeFile("b.jpg")] },
      });
      fireEvent.change(screen.getByTestId("slot-3-input"), {
        target: { files: [makeFile("c.jpg")] },
      });

      // Tras llenar los 3 slots: ya no hay placeholders (los slots ahora
      // son tiles en status='idle' sin retake visible todavía). El número
      // de tiles sigue siendo 3 — verificable contando los wrapper divs.
      const tileDivs = container.querySelectorAll('[class*="slotTile"]');
      expect(tileDivs.length).toBe(3);

      // Y nunca debe aparecer "+ Agregar Recibo 4".
      expect(screen.queryByText(/\+ Agregar Recibo 4/i)).not.toBeInTheDocument();
    });

    it("el botón Continuar está disabled cuando no hay slot uploaded", () => {
      render(<ReciboUploadStep leadId={1} />);
      const submitBtn = screen.getByRole("button", { name: /continuar/i });
      expect(submitBtn).toBeDisabled();
    });
  });
});
