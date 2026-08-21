// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import React, { useEffect } from "react";
import { renderHook, act, render, screen } from "@testing-library/react";

// Mocks: declarados ANTES de importar el hook bajo test
vi.mock("../../../../services/leadRegistrationService.js", () => ({
  __esModule: true,
  default: {
    subirRecibos: vi.fn(),
    eliminarRecibo: vi.fn(),
    getRecibosPendientes: vi.fn(),
  },
}));

import LeadRegistrationService from "../../../../services/leadRegistrationService.js";
import { NetworkError } from "../../../../lib/network-error";
import { useReciboUpload } from "../useReciboUpload";

const makeFile = (name = "recibo.jpg") =>
  new File(["(binary)"], name, { type: "image/jpeg" });

describe("useReciboUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("basic state", () => {
    it("inicializa con 3 slots null, isUploading false, uploadError vacío", () => {
      const { result } = renderHook(() => useReciboUpload());
      expect(result.current.slots).toEqual([null, null, null]);
      expect(result.current.isUploading).toBe(false);
      expect(result.current.uploadError).toBe("");
      expect(result.current.isFormValid).toBe(false);
    });

    it("expone addFileToSlot, clearSlot, uploadAll, setSlotHydrated", () => {
      const { result } = renderHook(() => useReciboUpload());
      expect(typeof result.current.addFileToSlot).toBe("function");
      expect(typeof result.current.clearSlot).toBe("function");
      expect(typeof result.current.uploadAll).toBe("function");
      expect(typeof result.current.setSlotHydrated).toBe("function");
    });
  });

  describe("addFileToSlot", () => {
    it("addFileToSlot(2, file) popula el slot en posición 1 sin tocar los demás", () => {
      const { result } = renderHook(() => useReciboUpload());
      const file = makeFile();
      act(() => {
        result.current.addFileToSlot(2, file);
      });
      expect(result.current.slots[0]).toBeNull();
      expect(result.current.slots[1]).toMatchObject({
        file,
        status: "idle",
      });
      expect(result.current.slots[1]?.preview).toMatch(/^blob:/);
      expect(result.current.slots[2]).toBeNull();
    });

    it("addFileToSlot con orden fuera de 1-3 es no-op", () => {
      const { result } = renderHook(() => useReciboUpload());
      act(() => {
        result.current.addFileToSlot(0, makeFile());
      });
      act(() => {
        result.current.addFileToSlot(4, makeFile());
      });
      expect(result.current.slots).toEqual([null, null, null]);
    });

    it("addFileToSlot marca al slot como 'idle' (no 'uploaded')", () => {
      const { result } = renderHook(() => useReciboUpload());
      act(() => {
        result.current.addFileToSlot(1, makeFile());
      });
      expect(result.current.slots[0]?.status).toBe("idle");
      expect(result.current.slots[0]?.reciboId).toBeUndefined();
    });
  });

  describe("uploadAll", () => {
    it("happy path: postea solo slots idle y mapea respuesta por orden", async () => {
      LeadRegistrationService.subirRecibos.mockResolvedValue({
        success: true,
        data: {
          recibos: [
            { id: 101, orden: 1 },
            { id: 102, orden: 2 },
          ],
        },
      });
      const { result } = renderHook(() => useReciboUpload());
      act(() => {
        result.current.addFileToSlot(1, makeFile("a.jpg"));
        result.current.addFileToSlot(2, makeFile("b.jpg"));
      });

      let r;
      await act(async () => {
        r = await result.current.uploadAll(123);
      });

      expect(r.success).toBe(true);
      expect(LeadRegistrationService.subirRecibos).toHaveBeenCalledTimes(1);
      const [callArg, filesByOrden] = LeadRegistrationService.subirRecibos.mock.calls[0];
      expect(callArg).toEqual({ leadId: 123 });
      expect(Object.keys(filesByOrden).sort()).toEqual(["1", "2"]);

      expect(result.current.slots[0]).toMatchObject({
        status: "uploaded",
        reciboId: 101,
      });
      expect(result.current.slots[1]).toMatchObject({
        status: "uploaded",
        reciboId: 102,
      });
      expect(result.current.slots[2]).toBeNull();
      expect(result.current.uploadError).toBe("");
    });

    it("omite slots no-idle (null o uploaded) y deja sus valores intactos", async () => {
      LeadRegistrationService.subirRecibos.mockResolvedValue({
        success: true,
        data: { recibos: [{ id: 200, orden: 2 }] },
      });
      const { result } = renderHook(() => useReciboUpload());
      // slot 0 ya uploaded, slot 1 idle, slot 2 null
      act(() => {
        result.current.setSlotHydrated(1, { reciboId: 999, url: "blob:u1", mime: "image/jpeg", size: 10 });
      });
      act(() => {
        result.current.addFileToSlot(2, makeFile("b.jpg"));
      });

      await act(async () => {
        await result.current.uploadAll(7);
      });

      const filesByOrden = LeadRegistrationService.subirRecibos.mock.calls[0][1];
      expect(Object.keys(filesByOrden)).toEqual(["2"]);
      expect(result.current.slots[0]).toMatchObject({ status: "uploaded", reciboId: 999 });
      expect(result.current.slots[1]).toMatchObject({ status: "uploaded", reciboId: 200 });
      expect(result.current.slots[2]).toBeNull();
    });

    it("mientras hay uploading, isFormValid=true solo si hay algún uploaded", async () => {
      let resolveUpload;
      LeadRegistrationService.subirRecibos.mockImplementation(
        () => new Promise((res) => { resolveUpload = () => res({ success: true, data: { recibos: [{ id: 1, orden: 1 }] } }); }),
      );
      const { result } = renderHook(() => useReciboUpload());
      act(() => {
        result.current.addFileToSlot(1, makeFile());
      });

      // lanzar upload sin await
      let uploadPromise;
      act(() => {
        uploadPromise = result.current.uploadAll(123);
      });

      expect(result.current.isUploading).toBe(true);
      expect(result.current.isFormValid).toBe(false);

      await act(async () => {
        resolveUpload();
        await uploadPromise;
      });

      expect(result.current.isUploading).toBe(false);
      expect(result.current.isFormValid).toBe(true);
    });

    it("response.success=false: marca slots como 'error' y expone uploadError con el message del server", async () => {
      LeadRegistrationService.subirRecibos.mockResolvedValue({
        success: false,
        message: "Archivo demasiado grande",
      });
      const { result } = renderHook(() => useReciboUpload());
      act(() => {
        result.current.addFileToSlot(1, makeFile());
      });

      let r;
      await act(async () => {
        r = await result.current.uploadAll(123);
      });

      expect(r.success).toBe(false);
      expect(result.current.uploadError).toContain("Archivo demasiado grande");
      expect(result.current.slots[0]?.status).toBe("error");
    });

    it("NetworkError rejected: uploadError contiene el mensaje amigable en español", async () => {
      LeadRegistrationService.subirRecibos.mockRejectedValue(
        new NetworkError(new TypeError("Failed to fetch")),
      );
      const { result } = renderHook(() => useReciboUpload());
      act(() => {
        result.current.addFileToSlot(1, makeFile());
      });

      await act(async () => {
        await result.current.uploadAll(123);
      });

      expect(result.current.uploadError).toContain("Sin conexión");
      expect(result.current.uploadError).toContain("WiFi");
      expect(result.current.uploadError).toContain("😊");
      expect(result.current.slots[0]?.status).toBe("error");
    });

    it("Error genérico thrown: preserva el message del server", async () => {
      LeadRegistrationService.subirRecibos.mockRejectedValue(
        new Error("Token inválido o expirado"),
      );
      const { result } = renderHook(() => useReciboUpload());
      act(() => {
        result.current.addFileToSlot(1, makeFile());
      });

      await act(async () => {
        await result.current.uploadAll(123);
      });

      expect(result.current.uploadError).toContain("Token inválido o expirado");
    });

    it("sin slots idle: no llama al service y retorna success:false", async () => {
      const { result } = renderHook(() => useReciboUpload());

      let r;
      await act(async () => {
        r = await result.current.uploadAll(123);
      });

      expect(r.success).toBe(false);
      expect(LeadRegistrationService.subirRecibos).not.toHaveBeenCalled();
    });

    it("leadId null/undefined: no llama al service y retorna early", async () => {
      const { result } = renderHook(() => useReciboUpload());
      act(() => {
        result.current.addFileToSlot(1, makeFile());
      });

      let r;
      await act(async () => {
        r = await result.current.uploadAll(null);
      });

      expect(r.success).toBe(false);
      expect(LeadRegistrationService.subirRecibos).not.toHaveBeenCalled();
    });
  });

  describe("clearSlot", () => {
    it("si el slot está uploaded: llama eliminarRecibo con su reciboId", async () => {
      LeadRegistrationService.eliminarRecibo.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useReciboUpload());
      act(() => {
        result.current.setSlotHydrated(2, { reciboId: 555, url: "blob:u", mime: "image/jpeg", size: 1 });
      });
      expect(result.current.slots[1]?.reciboId).toBe(555);

      await act(async () => {
        await result.current.clearSlot(2);
      });

      expect(LeadRegistrationService.eliminarRecibo).toHaveBeenCalledWith(555);
      expect(result.current.slots[1]).toBeNull();
    });

    it("si el slot está idle (no uploaded): NO llama eliminarRecibo", async () => {
      const { result } = renderHook(() => useReciboUpload());
      act(() => {
        result.current.addFileToSlot(1, makeFile());
      });

      await act(async () => {
        await result.current.clearSlot(1);
      });

      expect(LeadRegistrationService.eliminarRecibo).not.toHaveBeenCalled();
      expect(result.current.slots[0]).toBeNull();
    });

    it("si el slot es null: no llama eliminarRecibo y queda null", async () => {
      const { result } = renderHook(() => useReciboUpload());

      await act(async () => {
        await result.current.clearSlot(3);
      });

      expect(LeadRegistrationService.eliminarRecibo).not.toHaveBeenCalled();
      expect(result.current.slots[2]).toBeNull();
    });

    it("clearSlot fuera de rango es no-op", async () => {
      const { result } = renderHook(() => useReciboUpload());

      await act(async () => {
        await result.current.clearSlot(0);
      });
      await act(async () => {
        await result.current.clearSlot(4);
      });

      expect(LeadRegistrationService.eliminarRecibo).not.toHaveBeenCalled();
      expect(result.current.slots).toEqual([null, null, null]);
    });
  });

  describe("setSlotHydrated", () => {
    it("marca el slot como uploaded con hydrated:true y sin file", () => {
      const { result } = renderHook(() => useReciboUpload());
      const payload = {
        reciboId: "abc-123",
        url: "blob:recibos/1",
        mime: "application/pdf",
        size: 4096,
      };

      act(() => {
        result.current.setSlotHydrated(3, payload);
      });

      expect(result.current.slots[2]).toEqual({
        file: null,
        preview: "blob:recibos/1",
        reciboId: "abc-123",
        status: "uploaded",
        mime: "application/pdf",
        size: 4096,
        hydrated: true,
      });
      expect(result.current.isFormValid).toBe(true);
    });

    it("setSlotHydrated fuera de rango es no-op", () => {
      const { result } = renderHook(() => useReciboUpload());
      act(() => {
        result.current.setSlotHydrated(0, { reciboId: "x", url: "u", mime: "m", size: 1 });
      });
      act(() => {
        result.current.setSlotHydrated(4, { reciboId: "x", url: "u", mime: "m", size: 1 });
      });
      expect(result.current.slots).toEqual([null, null, null]);
    });

    /**
     * Whole-branch fix C-2 (2026-08-21): si el usuario pickeó un file en un
     * slot entre el mount del componente y la respuesta de rehydration,
     * el `setSlotHydrated` tardío NO debe pisar el slot — el file local
     * representa la intención más reciente del usuario.
     */
    it("NO pisa un slot donde el usuario ya pickeó un file (race rehydration vs addFileToSlot — C-2)", () => {
      const { result } = renderHook(() => useReciboUpload());
      const userFile = makeFile("user-pick.jpg");

      // 1) Usuario pickea el slot 1 entre mount y rehydration response.
      act(() => {
        result.current.addFileToSlot(1, userFile);
      });

      // 2) Llega la respuesta de rehydration y trata de hidratar el mismo slot.
      act(() => {
        result.current.setSlotHydrated(1, {
          reciboId: "uuid-back",
          url: "blob:recibos/from-back",
          mime: "application/pdf",
          size: 4096,
        });
      });

      // El file del usuario debe sobrevivir — setSlotHydrated debe ser no-op
      // cuando el slot ya tiene un file local.
      expect(result.current.slots[0]?.file).toBe(userFile);
      expect(result.current.slots[0]?.status).toBe("idle");
      expect(result.current.slots[0]?.reciboId).toBeUndefined();
      // El preview del back NO debe haberse aplicado.
      expect(result.current.slots[0]?.preview).not.toBe("blob:recibos/from-back");
    });

    it("SÍ hidrata un slot vacío que el usuario NO tocó (C-2 — comportamiento normal)", () => {
      const { result } = renderHook(() => useReciboUpload());
      act(() => {
        result.current.setSlotHydrated(2, {
          reciboId: "uuid-back",
          url: "blob:recibos/from-back",
          mime: "application/pdf",
          size: 4096,
        });
      });
      expect(result.current.slots[1]).toMatchObject({
        preview: "blob:recibos/from-back",
        reciboId: "uuid-back",
        status: "uploaded",
        hydrated: true,
      });
    });

    it("C-2: slot 1 con file del usuario sobrevive; slot 2 sin file se hidrata normalmente", () => {
      const { result } = renderHook(() => useReciboUpload());
      const userFile = makeFile("user.jpg");
      act(() => {
        result.current.addFileToSlot(1, userFile);
      });

      // Slot 1: el usuario ya pickeó → debe sobrevivir.
      act(() => {
        result.current.setSlotHydrated(1, {
          reciboId: "uuid-1-back",
          url: "blob:1-back",
          mime: "image/jpeg",
          size: 100,
        });
      });
      // Slot 3: vacío → debe hidratarse normalmente.
      act(() => {
        result.current.setSlotHydrated(3, {
          reciboId: "uuid-3-back",
          url: "blob:3-back",
          mime: "image/jpeg",
          size: 300,
        });
      });

      expect(result.current.slots[0]?.file).toBe(userFile);
      expect(result.current.slots[0]?.status).toBe("idle");
      expect(result.current.slots[1]).toBeNull();
      expect(result.current.slots[2]).toMatchObject({
        reciboId: "uuid-3-back",
        status: "uploaded",
        hydrated: true,
      });
    });
  });

  describe("rehydration end-to-end", () => {
    /**
     * Harness simula el flujo de ReciboUploadStep (Task 11):
     * al montar, trae los recibos pendientes del lead y llama
     * setSlotHydrated para cada uno. Verifica que el array
     * `slots` refleje el estado rehidratado (mezcla null + uploaded).
     */
    it("Harness rehidrata slots desde getRecibosPendientes: ordena 1 y 3 → slot 0 uploaded, slot 1 null, slot 2 uploaded", async () => {
      LeadRegistrationService.getRecibosPendientes.mockResolvedValue([
        { id: "uuid-1", orden: 1, url: "blob:u1", mime: "image/jpeg", size: 100 },
        { id: "uuid-3", orden: 3, url: "blob:u3", mime: "image/jpeg", size: 300 },
      ]);

      const RehydrationHarness = ({ leadId }) => {
        const { slots, setSlotHydrated } = useReciboUpload();
        useEffect(() => {
          let cancelled = false;
          (async () => {
            const rows = await LeadRegistrationService.getRecibosPendientes(leadId);
            if (cancelled) return;
            for (const row of rows) {
              setSlotHydrated(row.orden, {
                reciboId: row.id,
                url: row.url,
                mime: row.mime,
                size: row.size,
              });
            }
          })();
          return () => { cancelled = true; };
        }, [leadId, setSlotHydrated]);

        return (
          <div>
            <div data-testid='slot-0'>{slots[0] ? slots[0].reciboId : "null"}</div>
            <div data-testid='slot-1'>{slots[1] ? slots[1].reciboId : "null"}</div>
            <div data-testid='slot-2'>{slots[2] ? slots[2].reciboId : "null"}</div>
          </div>
        );
      };

      render(<RehydrationHarness leadId={42} />);

      // esperamos a que el effect asíncrono aplique las hidrataciones
      expect(await screen.findByText("uuid-1")).toBeInTheDocument();
      expect(screen.getByTestId("slot-1")).toHaveTextContent("null");
      expect(screen.getByTestId("slot-2")).toHaveTextContent("uuid-3");

      expect(LeadRegistrationService.getRecibosPendientes).toHaveBeenCalledWith(42);
    });
  });
});
