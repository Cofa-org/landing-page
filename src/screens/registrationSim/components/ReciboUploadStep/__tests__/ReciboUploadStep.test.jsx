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

// Mock imageCompression (2026-09-14 recibo-compression): los tests
// existentes usan JPEG via makeFile(); sin este mock, addFileToSlot
// iría a status='compressing' (JPEGs son compressibles) y los tests
// que esperan Quitar visible (idle) fallarían. El mock resuelve
// inmediatamente con el mismo file, manteniendo el flujo "idle tras
// selección" que estos tests asumen.
vi.mock("../../../../../lib/imageCompression.js", () => ({
  compressImageFile: vi.fn(async (file) => ({ blob: file, filename: file.name })),
  isCompressibleImage: vi.fn((file) =>
    /^image\/(jpeg|png|webp|heic|heif)$/.test(file?.type || "")
  ),
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
    it("muestra el texto aprobado y ambas indicaciones sin selector de modalidad", async () => {
      render(<ReciboUploadStep leadId={42} />);
      await screen.findByTestId("slot-1-input");
      expect(screen.getByText("Subí tu último recibo de sueldo así te podemos ofrecer el mejor préstamo para vos.")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Tené en cuenta" })).toBeInTheDocument();
      expect(screen.getByText("Adjuntá el recibo de sueldo correspondiente a tu último cobro.")).toBeInTheDocument();
      expect(screen.getByText("Adjuntá los recibos de la primera y segunda quincena del último mes completo. Cargá uno en el espacio disponible y presioná ‘Agregar otro recibo’ para adjuntar el segundo.")).toBeInTheDocument();
      expect(screen.queryByRole("radio")).not.toBeInTheDocument();
      expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Agregar otro recibo" })).toHaveAttribute("type", "button");
    });

    it("permite enviar un PDF aunque se hayan abierto tres espacios", async () => {
      const onSuccess = vi.fn();
      LeadRegistrationService.subirRecibos.mockResolvedValue({
        success: true, data: { recibos: [{ orden: 1, recibo_id: "pdf" }], estado_onboarding: "RECIBO_SUBIDO" },
      });
      render(<ReciboUploadStep leadId={42} onSuccess={onSuccess} />);
      await screen.findByTestId("slot-1-input");
      fireEvent.click(screen.getByRole("button", { name: "Agregar otro recibo" }));
      fireEvent.click(screen.getByRole("button", { name: "Agregar otro recibo" }));
      const pdf = new File(["synthetic pdf"], "recibo.pdf", { type: "application/pdf" });
      fireEvent.change(screen.getByTestId("slot-1-input"), { target: { files: [pdf] } });
      fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
      await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
      expect(LeadRegistrationService.subirRecibos.mock.calls[0][1]).toEqual({ 1: pdf });
    });

    it("recarga agrega progresivamente hasta seis y muestra el máximo autorizado", async () => {
      const { container } = render(<ReciboUploadStep leadId={42} maxSlots={6} />);
      await screen.findByTestId("slot-1-input");
      expect(countFileInputs(container)).toBe(1);
      for (let click = 0; click < 5; click += 1) {
        fireEvent.click(screen.getByRole("button", { name: "Agregar otro recibo" }));
      }
      expect(countFileInputs(container)).toBe(6);
      expect(screen.getByText("Podés adjuntar hasta 6 recibos.")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Agregar otro recibo" })).not.toBeInTheDocument();
    });

    it("muestra pendientes con huecos y el sexto sin exigir clicks", async () => {
      LeadRegistrationService.getRecibosPendientes.mockResolvedValue([
        { orden: 6, recibo_id: "six", url: "https://example.test/six.pdf", mime: "application/pdf", size: 100 },
        { orden: 1, recibo_id: "one", url: "https://example.test/one.pdf", mime: "application/pdf", size: 100 },
        { orden: 3, recibo_id: "three", url: "https://example.test/three.pdf", mime: "application/pdf", size: 100 },
      ]);
      render(<ReciboUploadStep leadId={42} maxSlots={6} />);
      await screen.findByText("Recibo 6");
      expect(screen.getByText("Recibo 1")).toBeInTheDocument();
      expect(screen.getByText("Recibo 3")).toBeInTheDocument();
      expect(screen.getByTestId("slot-2-input")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
    });

    it.each([[43, 6], [42, 3]])("cambiar lead/capacidad a %s/%s descarta archivos locales", async (leadId, maxSlots) => {
      const { rerender } = render(<ReciboUploadStep leadId={42} maxSlots={6} />);
      await screen.findByTestId("slot-1-input");
      const pdf = new File(["synthetic pdf"], "previous-session.pdf", { type: "application/pdf" });
      fireEvent.change(screen.getByTestId("slot-1-input"), { target: { files: [pdf] } });
      expect(screen.getAllByText(/previous-session.pdf/).length).toBeGreaterThan(0);
      rerender(<ReciboUploadStep leadId={leadId} maxSlots={maxSlots} />);
      await screen.findByTestId("slot-1-input");
      expect(screen.queryAllByText(/previous-session.pdf/)).toHaveLength(0);
      expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
      expect(LeadRegistrationService.getRecibosPendientes).toHaveBeenLastCalledWith(leadId, expect.any(AbortSignal));
    });

    it("renderiza un único espacio por defecto", async () => {
      const { container } = render(<ReciboUploadStep leadId={1} />);
      // Task 6: durante el RTT de rehydration el componente muestra
      // skeleton, no inputs. Al resolver pendientes vacíos aparece un espacio.
      await waitFor(() => {
        expect(countFileInputs(container)).toBe(1);
      });
    });

    it("revela espacios numerados al pedir agregar otro recibo", async () => {
      render(<ReciboUploadStep leadId={1} />);
      // Task 6: esperar la salida del estado `hydrating` antes de
      // inspeccionar los labels de los placeholders.
      await waitFor(() => {
        expect(screen.getByText(/\+ Subir Recibo 1/i)).toBeInTheDocument();
      });
      expect(screen.queryByText(/\+ Subir Recibo 2/i)).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Agregar otro recibo" }));
      expect(screen.getByText(/\+ Subir Recibo 2/i)).toBeInTheDocument();
      expect(screen.getByTestId("slot-2-input")).toHaveFocus();
      expect(screen.getByRole("status")).toHaveTextContent("Mostrando 2 de 3 espacios para recibos.");
      fireEvent.click(screen.getByRole("button", { name: "Agregar otro recibo" }));
      expect(screen.getByText(/\+ Subir Recibo 3/i)).toBeInTheDocument();
      expect(screen.getByTestId("slot-3-input")).toHaveFocus();
      expect(screen.queryByRole("button", { name: "Agregar otro recibo" })).not.toBeInTheDocument();
      expect(LeadRegistrationService.subirRecibos).not.toHaveBeenCalled();
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

      // Task 6: esperar fin de hydration antes de tocar inputs.
      await waitFor(() => {
        expect(screen.getByTestId("slot-1-input")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: "Agregar otro recibo" }));

      // Slot 1 (data-testid="slot-1-input") → fire change.
      const slot1Input = screen.getByTestId("slot-1-input");
      fireEvent.change(slot1Input, { target: { files: [makeFile("a.jpg")] } });

      const submitBtn = screen.getByRole("button", { name: /continuar/i });
      await waitFor(() => expect(submitBtn).toBeEnabled());
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

    it("nunca renderiza un 4to slot (max 3)", async () => {
      const { container } = render(<ReciboUploadStep leadId={7} />);

      // Task 6: esperar fin de hydration antes de contar inputs.
      await waitFor(() => {
        expect(countFileInputs(container)).toBe(1);
      });
      fireEvent.click(screen.getByRole("button", { name: "Agregar otro recibo" }));
      fireEvent.click(screen.getByRole("button", { name: "Agregar otro recibo" }));

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

    it("el botón Continuar está disabled cuando no hay slot uploaded", async () => {
      render(<ReciboUploadStep leadId={1} />);
      // Task 6: esperar fin de hydration; el botón existe siempre, pero
      // esta aserción debe correr cuando el form está listo.
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /continuar/i }),
        ).toBeInTheDocument();
      });
      const submitBtn = screen.getByRole("button", { name: /continuar/i });
      expect(submitBtn).toBeDisabled();
    });
  });

  describe("Hydration skeleton (Task 6: hydrating state during RTT)", () => {
    it("shows skeleton placeholders (no file inputs visible) while getRecibosPendientes is in-flight", () => {
      // Never-resolving promise keeps the rehydration RTT open so the
      // component stays in its `hydrating` initial state.
      LeadRegistrationService.getRecibosPendientes.mockReturnValue(
        new Promise(() => {}),
      );

      const { container } = render(<ReciboUploadStep leadId={1} />);

      // No file inputs are rendered while hydrating — placeholders are
      // suppressed in favor of skeleton tiles (data-testid="hydration-skeleton").
      expect(countFileInputs(container)).toBe(0);
      const skeletons = container.querySelectorAll(
        '[data-testid="hydration-skeleton"]',
      );
      expect(skeletons.length).toBe(1);
      expect(screen.getByRole("button", { name: "Agregar otro recibo" })).toBeDisabled();
    });

    it("replaces skeletons with real slots after getRecibosPendientes resolves", async () => {
      // Pendientes vacíos: aparece únicamente el primer espacio.
      LeadRegistrationService.getRecibosPendientes.mockResolvedValue([]);

      const { container } = render(<ReciboUploadStep leadId={1} />);

      // After awaiting the resolution, the 3 slot inputs appear and the
      // skeletons are gone.
      await waitFor(() => {
        expect(countFileInputs(container)).toBe(1);
      });
      expect(
        container.querySelectorAll('[data-testid="hydration-skeleton"]').length,
      ).toBe(0);
    });

    it("renders empty slots (NOT skeletons) on first render when leadId is null", () => {
      // I2 (whole-branch review 2026-08-31): when `leadId` is null/undefined,
      // the useEffect early-returns without firing getRecibosPendientes, but
      // `useState(true)` causes a one-frame flash of skeleton tiles before
      // the effect runs. The fix initializes `hydrating` from
      // `Boolean(leadId)` so the first render reflects the no-RTT case
      // immediately (empty slots, not skeletons).
      //
      // No getRecibosPendientes mock is needed: the effect early-returns
      // before calling the service. The `beforeEach` mock is harmless.
      const { container } = render(<ReciboUploadStep leadId={null} />);

      // Skeletons must NOT render on first paint.
      expect(
        container.querySelectorAll('[data-testid="hydration-skeleton"]').length,
      ).toBe(0);
      // El primer espacio debe aparecer sin una skeleton intermedia.
      expect(countFileInputs(container)).toBe(1);
    });
  });

  describe("Rehydration (Task 4: derive filename from storage_path)", () => {
    it("derives filename from storage_path's last segment and shows it in the hydrated tile", async () => {
      // storage_path shape (from simulador_prestamos_recibo): the last
      // segment after "/" is the original filename. El rehydration debe
      // extraerlo y dejarlo visible en el fileMeta del tile.
      LeadRegistrationService.getRecibosPendientes.mockResolvedValue([
        {
          recibo_id: "uuid-recibo-1",
          orden: 1,
          url: "blob:recibos/lead-123/PENDIENTE/RECIBO/recibo.jpg",
          mime: "image/jpeg",
          size: 12345,
          storage_path: "lead-123/PENDIENTE/RECIBO/recibo.jpg",
        },
      ]);

      render(<ReciboUploadStep leadId={123} />);

      // Tras rehydration, el slot 1 deja de ser placeholder y se vuelve
      // tile uploaded. El filename derivado del storage_path debe estar
      // visible en el fileMeta del header.
      await waitFor(() => {
        expect(screen.getByText(/recibo\.jpg/)).toBeInTheDocument();
      });
    });

    it("still hydrates the slot even when storage_path is missing (filename null)", async () => {
      // Backward compat: si una fila legacy no tiene storage_path, el slot
      // se hidrata igual (sin nombre). El placeholder desaparece → tile
      // uploaded renderiza, sin fileMeta visible.
      LeadRegistrationService.getRecibosPendientes.mockResolvedValue([
        {
          recibo_id: "uuid-legacy",
          orden: 1,
          url: "blob:recibos/legacy.jpg",
          mime: "image/jpeg",
          size: 4096,
          // storage_path ausente
        },
      ]);

      render(<ReciboUploadStep leadId={456} />);

      // Slot 1 debe hidratar (placeholder "Subir Recibo 1" desaparece).
      await waitFor(() => {
        expect(screen.queryByTestId("slot-1-input")).not.toBeInTheDocument();
      });
      // El tile muestra el status "Subido" sin nombre (porque filename es null).
      expect(screen.getByText(/subido/i)).toBeInTheDocument();
    });
  });

  describe("Quitar visibility (pre-upload pivot 2026-08-21)", () => {
    it("shows Quitar when slot has idle status (before upload)", async () => {
      render(<ReciboUploadStep leadId={1} />);
      // Task 6: esperar fin de hydration antes de tocar inputs.
      await waitFor(() => {
        expect(screen.getByTestId("slot-1-input")).toBeInTheDocument();
      });
      // Slot 1 (data-testid="slot-1-input") → fire change. Slot pasa a compressing → idle.
      fireEvent.change(screen.getByTestId("slot-1-input"), {
        target: { files: [makeFile("a.jpg")] },
      });
      // 2026-09-14 compression: addFileToSlot es async (compresión).
      // Quitar aparece solo cuando el slot llega a 'idle' — esperar la transición.
      await waitFor(() => {
        expect(screen.getByTestId("slot-1-quitar")).toBeInTheDocument();
      });
    });

    it("shows Cambiar archivo button when slot has idle status (pre-upload)", async () => {
      render(<ReciboUploadStep leadId={1} />);
      // Task 6: esperar fin de hydration antes de tocar inputs.
      await waitFor(() => {
        expect(screen.getByTestId("slot-1-input")).toBeInTheDocument();
      });
      fireEvent.change(screen.getByTestId("slot-1-input"), {
        target: { files: [makeFile("a.jpg")] },
      });
      // 2026-09-14 compression: Cambiar archivo solo aparece en 'idle' — esperar.
      await waitFor(() => {
        expect(screen.getByTestId("slot-1-retake")).toBeInTheDocument();
      });
    });

    it("calls onClear when Quitar is clicked (pre-upload)", async () => {
      render(<ReciboUploadStep leadId={1} />);
      // Task 6: esperar fin de hydration antes de tocar inputs.
      await waitFor(() => {
        expect(screen.getByTestId("slot-1-input")).toBeInTheDocument();
      });
      fireEvent.change(screen.getByTestId("slot-1-input"), {
        target: { files: [makeFile("a.jpg")] },
      });
      // 2026-09-14 compression: esperar que el slot llegue a 'idle' antes de Quitar.
      const quitarBtn = await waitFor(() => screen.getByTestId("slot-1-quitar"));
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
      // Task 6: esperar fin de hydration antes de tocar inputs.
      await waitFor(() => {
        expect(screen.getByTestId("slot-1-input")).toBeInTheDocument();
      });
      fireEvent.change(screen.getByTestId("slot-1-input"), {
        target: { files: [makeFile("a.jpg")] },
      });
      const submitBtn = screen.getByRole("button", { name: /continuar/i });
      await waitFor(() => expect(submitBtn).toBeEnabled());
      fireEvent.click(submitBtn);

      await waitFor(() => expect(screen.getByText("Subido")).toBeInTheDocument());

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

    it("renderiza el slot dentro del formulario sin overflow markers a 360px", async () => {
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
        // Task 6: esperar fin de hydration antes de contar placeholders.
        await waitFor(() => {
          expect(form.querySelectorAll('input[type="file"]').length).toBe(1);
        });
        // SlotTile wrappers sit inside the form (no horizontal-scroll-bearing
        // divs injected by the component).
        const slotTile = form.querySelector('[class*="slotTile"]');
        expect(slotTile).toBeNull(); // No file uploaded → no slotTile, only placeholders.
        // Solo se ofrece el primer espacio inicialmente.
        expect(form.querySelectorAll('input[type="file"]').length).toBe(1);
      } finally {
        Object.defineProperty(window, "innerWidth", {
          value: original,
          configurable: true,
        });
      }
    });
  });
});
