import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import LeadRegistrationService from "../../../../services/leadRegistrationService.js";
import { compressImageFile, isCompressibleImage } from "../../../../lib/imageCompression.js";
import { openCallbellWebchat } from "../../../../utils/callbellHelpers.js";
import { useReciboUploadStep } from "../useReciboUploadStep.js";

vi.mock("../../../../services/leadRegistrationService.js", () => ({
  default: { getRecibosPendientes: vi.fn(), subirRecibos: vi.fn() },
}));
vi.mock("../../../../lib/imageCompression.js", () => ({
  compressImageFile: vi.fn(), isCompressibleImage: vi.fn(),
}));
vi.mock("../../../../utils/callbellHelpers.js", () => ({ openCallbellWebchat: vi.fn() }));

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};
const makePdf = (name = "recibo.pdf") => new File(["synthetic receipt"], name, { type: "application/pdf" });
const makePending = (orden, storagePath = null) => ({
  orden, recibo_id: `receipt-${orden}`, url: `https://example.test/${orden}.pdf`,
  mime: "application/pdf", size: 100, storage_path: storagePath,
  subido_en: "2026-11-01T12:00:00Z",
});
const submitEvent = () => ({ preventDefault: vi.fn() });
const readyHook = async (props = {}) => {
  const rendered = renderHook(() => useReciboUploadStep({ leadId: 42, ...props }));
  await waitFor(() => expect(rendered.result.current.hydrating).toBe(false));
  return rendered;
};
const addPdf = async (result, orden = 1, filename) => {
  await act(async () => { await result.current.addFileToSlot(orden, makePdf(filename)); });
};

describe("useReciboUploadStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:synthetic-receipt");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    LeadRegistrationService.getRecibosPendientes.mockResolvedValue([]);
    LeadRegistrationService.subirRecibos.mockResolvedValue({
      success: true,
      data: { recibos: [{ orden: 1, recibo_id: "new-receipt" }], estado_onboarding: "RECIBO_SUBIDO" },
    });
    isCompressibleImage.mockReturnValue(false);
    compressImageFile.mockReset();
  });
  afterEach(() => vi.restoreAllMocks());

  it("inicia con un espacio y agrega hasta tres sin subir archivos", async () => {
    const { result } = await readyHook();
    expect(result.current.visibleSlots).toEqual([{ orden: 1, slot: null }]);
    expect(result.current.isContinueDisabled).toBe(true);
    act(() => { result.current.handleAddReceipt(); result.current.handleAddReceipt(); result.current.handleAddReceipt(); });
    expect(result.current.visibleSlots.map(receipt => receipt.orden)).toEqual([1, 2, 3]);
    expect(result.current.canAddReceipt).toBe(false);
    expect(LeadRegistrationService.subirRecibos).not.toHaveBeenCalled();
  });

  it.each([[4, 4], [5, 5], [6, 6], [undefined, 3], [null, 3], [0, 3], [7, 3], [3.5, 3], ["6", 3]])(
    "respeta capacidad %s y satura en %s espacios", async (maxSlots, expectedCount) => {
      const { result } = await readyHook({ maxSlots });
      act(() => { for (let click = 0; click < 8; click += 1) result.current.handleAddReceipt(); });
      expect(result.current.visibleSlots).toHaveLength(expectedCount);
      expect(result.current.canAddReceipt).toBe(false);
      expect(result.current.limitMessage).toBe(`Podés adjuntar hasta ${expectedCount} recibos.`);
    },
  );

  it("sin lead no consulta ni permite enviar", async () => {
    const { result } = await readyHook({ leadId: null });
    await addPdf(result);
    expect(LeadRegistrationService.getRecibosPendientes).not.toHaveBeenCalled();
    expect(result.current.isContinueDisabled).toBe(true);
    await act(async () => { await result.current.handleSubmit(submitEvent()); });
    expect(LeadRegistrationService.subirRecibos).not.toHaveBeenCalled();
  });

  it("hidrata órdenes desordenados sin compactar huecos y conserva filename legacy", async () => {
    LeadRegistrationService.getRecibosPendientes.mockResolvedValue([
      makePending(3, "lead/recibo/noviembre.pdf"), makePending(1),
    ]);
    const { result } = await readyHook();
    expect(result.current.visibleSlots.map(receipt => receipt.orden)).toEqual([1, 2, 3]);
    expect(result.current.visibleSlots[0].slot.filename).toBeNull();
    expect(result.current.visibleSlots[1].slot).toBeNull();
    expect(result.current.visibleSlots[2].slot.filename).toBe("noviembre.pdf");
    expect(result.current.isContinueDisabled).toBe(true);
  });

  it("revela el sexto recibo persistido y descarta órdenes inválidos", async () => {
    LeadRegistrationService.getRecibosPendientes.mockResolvedValue([
      makePending(0), makePending(7), makePending(1.5), makePending("3"), null, makePending(6),
    ]);
    const { result } = await readyHook({ maxSlots: 6 });
    expect(result.current.visibleSlots).toHaveLength(6);
    expect(result.current.visibleSlots[5].slot.reciboId).toBe("receipt-6");
    expect(result.current.visibleSlots[2].slot).toBeNull();
  });

  it("no revela un pendiente por encima del máximo normal", async () => {
    LeadRegistrationService.getRecibosPendientes.mockResolvedValue([makePending(6)]);
    const { result } = await readyHook();
    expect(result.current.visibleSlots).toEqual([{ orden: 1, slot: null }]);
  });

  it("quitar un archivo no colapsa ni renumera los demás", async () => {
    const { result } = await readyHook();
    act(() => { result.current.handleAddReceipt(); result.current.handleAddReceipt(); });
    await addPdf(result, 2, "second.pdf");
    await addPdf(result, 3, "third.pdf");
    await act(async () => { await result.current.clearSlot(2); });
    expect(result.current.visibleSlots).toHaveLength(3);
    expect(result.current.visibleSlots[1].slot).toBeNull();
    expect(result.current.visibleSlots[2].slot.file.name).toBe("third.pdf");
    expect(result.current.isContinueDisabled).toBe(false);
  });

  it("bloquea envío y agregado mientras recupera pendientes", async () => {
    const pending = deferred();
    LeadRegistrationService.getRecibosPendientes.mockReturnValue(pending.promise);
    const { result } = renderHook(() => useReciboUploadStep({ leadId: 42 }));
    expect(result.current.slotsAnnouncement).toBe("Cargando recibos.");
    expect(result.current.isAddReceiptDisabled).toBe(true);
    act(() => result.current.handleAddReceipt());
    expect(result.current.visibleSlots).toHaveLength(1);
    await addPdf(result);
    await act(async () => { await result.current.handleSubmit(submitEvent()); });
    expect(LeadRegistrationService.subirRecibos).not.toHaveBeenCalled();
    await act(async () => pending.resolve([]));
  });

  it("un PDF listo no permite omitir otra imagen en compresión o con error", async () => {
    const compression = deferred();
    const { result } = await readyHook();
    act(() => result.current.handleAddReceipt());
    await addPdf(result);
    isCompressibleImage.mockReturnValue(true);
    compressImageFile.mockReturnValue(compression.promise);
    let selecting;
    act(() => { selecting = result.current.addFileToSlot(2, new File(["bad jpeg"], "photo.jpg", { type: "image/jpeg" })); });
    expect(result.current.isContinueDisabled).toBe(true);
    await act(async () => { await result.current.handleSubmit(submitEvent()); });
    expect(LeadRegistrationService.subirRecibos).not.toHaveBeenCalled();
    await act(async () => { compression.reject(new Error("Cannot decode")); await selecting; });
    expect(result.current.isContinueDisabled).toBe(true);
    await act(async () => { await result.current.handleSubmit(submitEvent()); });
    expect(LeadRegistrationService.subirRecibos).not.toHaveBeenCalled();
    await act(async () => { await result.current.clearSlot(2); });
    expect(result.current.isContinueDisabled).toBe(false);
  });

  it("una respuesta tardía no pisa el archivo local", async () => {
    const pending = deferred();
    LeadRegistrationService.getRecibosPendientes.mockReturnValue(pending.promise);
    const { result } = renderHook(() => useReciboUploadStep({ leadId: 42 }));
    await addPdf(result, 1, "local.pdf");
    await act(async () => pending.resolve([makePending(1)]));
    expect(result.current.visibleSlots[0].slot.file.name).toBe("local.pdf");
  });

  it.each([null, {}])("respuesta inválida %s libera la recuperación y registra el fallo", async (response) => {
    LeadRegistrationService.getRecibosPendientes.mockResolvedValue(response);
    const { result } = await readyHook();
    expect(console.warn).toHaveBeenCalledWith("RECIBOS_REHYDRATE_FAILED:", expect.any(Error));
    await addPdf(result);
    expect(result.current.isContinueDisabled).toBe(false);
  });

  it("fallo de recuperación no impide adjuntar", async () => {
    LeadRegistrationService.getRecibosPendientes.mockRejectedValue(new Error("Offline"));
    const { result } = await readyHook();
    await addPdf(result);
    expect(result.current.isContinueDisabled).toBe(false);
    expect(console.warn).toHaveBeenCalledOnce();
  });

  it("aborta al desmontar y no registra una respuesta cancelada", async () => {
    const pending = deferred();
    LeadRegistrationService.getRecibosPendientes.mockReturnValue(pending.promise);
    const { unmount } = renderHook(() => useReciboUploadStep({ leadId: 42 }));
    const signal = LeadRegistrationService.getRecibosPendientes.mock.calls[0][1];
    unmount();
    expect(signal.aborted).toBe(true);
    await act(async () => pending.reject(new DOMException("Aborted", "AbortError")));
    expect(console.warn).not.toHaveBeenCalled();
  });

  it.each([["RECIBO_SUBIDO", "success"], ["EN_ANALISIS", "analysis"]])(
    "navega desde %s al callback %s y envía un solo adjunto", async (estado, destination) => {
      const onSuccess = vi.fn();
      const onAnalysisAfterRecibo = vi.fn();
      const response = { recibos: [{ orden: 1, recibo_id: "new" }], estado_onboarding: estado };
      LeadRegistrationService.subirRecibos.mockResolvedValue({ success: true, data: response });
      const { result } = await readyHook({ onSuccess, onAnalysisAfterRecibo });
      act(() => { result.current.handleAddReceipt(); result.current.handleAddReceipt(); });
      await addPdf(result);
      await act(async () => { await result.current.handleSubmit(submitEvent()); });
      expect(Object.keys(LeadRegistrationService.subirRecibos.mock.calls[0][1])).toEqual(["1"]);
      if (destination === "success") {
        expect(onSuccess).toHaveBeenCalledOnce();
        expect(onAnalysisAfterRecibo).not.toHaveBeenCalled();
      } else {
        expect(onAnalysisAfterRecibo).toHaveBeenCalledWith(response);
        expect(onSuccess).not.toHaveBeenCalled();
      }
    },
  );

  it("excluye doble submit inmediato y bloquea acciones mientras carga", async () => {
    const upload = deferred();
    LeadRegistrationService.subirRecibos.mockReturnValue(upload.promise);
    const onSuccess = vi.fn();
    const { result } = await readyHook({ onSuccess });
    await addPdf(result);
    let sending;
    await act(async () => {
      sending = result.current.handleSubmit(submitEvent());
      await result.current.handleSubmit(submitEvent());
    });
    expect(LeadRegistrationService.subirRecibos).toHaveBeenCalledOnce();
    expect(result.current.isContinueDisabled).toBe(true);
    expect(result.current.isAddReceiptDisabled).toBe(true);
    await act(async () => { upload.resolve({ success: true, data: { recibos: [] } }); await sending; });
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it("no navega en error ni al resolverse un envío después de desmontar", async () => {
    const onSuccess = vi.fn();
    const onAnalysisAfterRecibo = vi.fn();
    LeadRegistrationService.subirRecibos.mockResolvedValue({ success: false, message: "Upload failed" });
    const first = await readyHook({ onSuccess, onAnalysisAfterRecibo });
    await addPdf(first.result);
    await act(async () => { await first.result.current.handleSubmit(submitEvent()); });
    expect(first.result.current.displayError).toContain("Upload failed");
    expect(onSuccess).not.toHaveBeenCalled();
    first.unmount();
    const upload = deferred();
    LeadRegistrationService.subirRecibos.mockReturnValue(upload.promise);
    const second = await readyHook({ onSuccess, onAnalysisAfterRecibo });
    await addPdf(second.result);
    let sending;
    act(() => { sending = second.result.current.handleSubmit(submitEvent()); });
    second.unmount();
    await act(async () => { upload.resolve({ success: true, data: { estado_onboarding: "EN_ANALISIS", recibos: [] } }); await sending; });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onAnalysisAfterRecibo).not.toHaveBeenCalled();
  });

  it("respeta loading externo y abre el chat con su handler", async () => {
    const { result } = await readyHook({ loading: true, error: "External failure" });
    await addPdf(result);
    expect(result.current.isContinueDisabled).toBe(true);
    expect(result.current.displayError).toBe("External failure");
    act(() => result.current.handleContactAdvisor());
    expect(openCallbellWebchat).toHaveBeenCalledOnce();
  });
});
