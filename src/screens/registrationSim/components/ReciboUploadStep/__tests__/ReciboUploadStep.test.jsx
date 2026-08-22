// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mocks: declarados ANTES de importar el componente bajo test.
vi.mock("../../../../../services/leadRegistrationService.js", () => ({
  __esModule: true,
  default: {
    getRecibosPendientes: vi.fn(),
    subirRecibos: vi.fn(),
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
  });

  describe("renderizado inicial", () => {
    it("renderiza 3 slots por defecto", () => {
      const { container } = render(<ReciboUploadStep leadId={1} />);
      // Cada slot expone su input file (vacío al inicio). 3 slots → 3 inputs.
      expect(countFileInputs(container)).toBe(3);
    });

    it("muestra '+ Subir Recibo N' en cada placeholder, con N = número de slot", () => {
      render(<ReciboUploadStep leadId={1} />);
      // El label de cada placeholder refleja SU slot (orden), no el próximo.
      expect(screen.getByText(/\+ Subir Recibo 1/i)).toBeInTheDocument();
      expect(screen.getByText(/\+ Subir Recibo 2/i)).toBeInTheDocument();
      expect(screen.getByText(/\+ Subir Recibo 3/i)).toBeInTheDocument();
      // No debe quedar ningún label de la convención vieja.
      expect(screen.queryByText(/\+ Agregar Recibo/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Tocar para subir/i)).not.toBeInTheDocument();
    });

    it("después de subir Recibo 1, el slot 2 sigue mostrando '+ Subir Recibo 2' (NO '+ Agregar Recibo 3')", async () => {
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
        // es un tile con preview). Slot 2 debe seguir mostrando su label.
        expect(screen.queryByTestId("slot-1-input")).not.toBeInTheDocument();
      });

      // El slot 2 mantiene su label propio. NO degenera en "+ Agregar Recibo 3".
      expect(screen.getByText(/\+ Subir Recibo 2/i)).toBeInTheDocument();
      expect(screen.queryByText(/\+ Agregar Recibo 3/i)).not.toBeInTheDocument();
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

      // Nunca debe aparecer nada que sugiera un slot 4.
      expect(screen.queryByText(/\+ Subir Recibo 4/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/\+ Agregar Recibo 4/i)).not.toBeInTheDocument();
    });

    it("el botón Continuar está disabled cuando no hay slot uploaded", () => {
      render(<ReciboUploadStep leadId={1} />);
      const submitBtn = screen.getByRole("button", { name: /continuar/i });
      expect(submitBtn).toBeDisabled();
    });
  });

  describe("Quitar visibility (pre-upload pivot 2026-08-21)", () => {
    it("shows Quitar when slot has idle status (before upload)", () => {
      render(<ReciboUploadStep leadId={1} />);
      // Slot 1 (data-testid="slot-1-input") → fire change. Slot pasa a idle.
      fireEvent.change(screen.getByTestId("slot-1-input"), {
        target: { files: [makeFile("a.jpg")] },
      });
      // Quitar debe estar visible — el usuario puede descartar la selección
      // antes de mandar Continuar. Selector cambia a data-testid porque
      // el nuevo Quitar es icon-only con aria-label.
      expect(screen.getByTestId("slot-1-quitar")).toBeInTheDocument();
    });

    it("shows Cambiar archivo button when slot has idle status (pre-upload)", () => {
      render(<ReciboUploadStep leadId={1} />);
      fireEvent.change(screen.getByTestId("slot-1-input"), {
        target: { files: [makeFile("a.jpg")] },
      });
      // Cambiar archivo es el botón full-width del footer del tile.
      expect(screen.getByTestId("slot-1-retake")).toBeInTheDocument();
    });

    it("calls onClear when Quitar is clicked (pre-upload)", () => {
      render(<ReciboUploadStep leadId={1} />);
      fireEvent.change(screen.getByTestId("slot-1-input"), {
        target: { files: [makeFile("a.jpg")] },
      });
      const quitarBtn = screen.getByTestId("slot-1-quitar");
      fireEvent.click(quitarBtn);
      // Tras Quitar, el slot vuelve al placeholder: aparece "Subir Recibo 1".
      expect(screen.getByText(/\+ Subir Recibo 1/i)).toBeInTheDocument();
    });

    it("hides Quitar when slot is uploaded (post-upload)", async () => {
      LeadRegistrationService.subirRecibos.mockResolvedValue({
        success: true,
        data: { recibos: [{ id: 100, orden: 1 }] },
      });
      render(<ReciboUploadStep leadId={7} />);
      fireEvent.change(screen.getByTestId("slot-1-input"), {
        target: { files: [makeFile("a.jpg")] },
      });
      const submitBtn = screen.getByRole("button", { name: /continuar/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        // Tras upload exitoso: el slot 1 ahora es un tile en status='uploaded'.
        // Quitar NO debe estar visible (post-upload es responsabilidad del
        // operador vía backoffice direct-DB, no del front).
        expect(screen.queryByRole("button", { name: /quitar/i })).not.toBeInTheDocument();
      });
    });
  });

  describe("Responsive (≤480px viewport)", () => {
    // jsdom doesn't compute real CSS layout, so we assert on the *rules*
    // present in the CSS module file to guard against accidental removal of
    // the responsive fixes. If a future refactor drops the @media blocks,
    // these tests fail before users see overflow on 360px devices.
    const cssPath = path.join(__dirname, "..", "ReciboUploadStep.module.css");
    const readCss = () => fs.readFileSync(cssPath, "utf-8");

    const extractMediaBlock = (source, headerRe) => {
      const re = new RegExp(
        `@media\\s*\\(\\s*${headerRe}\\s*\\)\\s*\\{([\\s\\S]*?)\\n\\}`,
        "m",
      );
      const m = source.match(re);
      return m ? m[1] : null;
    };

    it("includes a @media (max-width: 480px) block that drops the slot max-width", () => {
      const css = readCss();
      const block = extractMediaBlock(css, "max-width:\\s*480px");
      expect(block, "Missing @media (max-width: 480px) block").not.toBeNull();
      // The fix overwrites the desktop max-width: 360px with max-width: 100%
      // so the slot can shrink without overflowing the container at 360px.
      expect(block).toMatch(/\.slotTile[\s\S]*?max-width:\s*100%/);
      // Quitar is 36×36 absolute at right: 12px → slotHeader reserves 48px
      // on the right so fileMeta doesn't overlap the icon button.
      expect(block).toMatch(/\.slotHeader[\s\S]*?padding-right:\s*48px/);
      // Empty slot's min-width: 250px would force overflow at narrow
      // viewports; the fix resets it to 0.
      expect(block).toMatch(/\.uploadArea[\s\S]*?min-width:\s*0/);
    });

    it("includes a tighter @media (max-width: 380px) block for ultra-narrow phones", () => {
      const css = readCss();
      const block = extractMediaBlock(css, "max-width:\\s*380px");
      expect(block, "Missing @media (max-width: 380px) block").not.toBeNull();
      // The ultra-narrow block must collapse the form padding.
      expect(block).toMatch(/\.formTemplateContainer[\s\S]*?padding:\s*var\(--spacing-sm\)/);
    });

    it("renderiza el slot dentro del formulario sin overflow markers a 360px", () => {
      // Mock narrow viewport. jsdom doesn't apply CSS, so we only assert
      // structural integrity: the slot wrapper exists, has its data-state
      // attribute and is contained inside the form element.
      const original = window.innerWidth;
      Object.defineProperty(window, "innerWidth", {
        value: 360,
        configurable: true,
      });
      try {
        const { container } = render(<ReciboUploadStep leadId={1} />);
        const form = container.querySelector("form");
        expect(form).not.toBeNull();
        // SlotTile wrappers sit inside the form (no horizontal-scroll-bearing
        // divs injected by the component).
        const slotTile = form.querySelector('[class*="slotTile"]');
        expect(slotTile).toBeNull(); // No file uploaded → no slotTile, only placeholders.
        // Placeholders exist for all 3 slots.
        expect(form.querySelectorAll('input[type="file"]').length).toBe(3);
      } finally {
        Object.defineProperty(window, "innerWidth", {
          value: original,
          configurable: true,
        });
      }
    });
  });
});
