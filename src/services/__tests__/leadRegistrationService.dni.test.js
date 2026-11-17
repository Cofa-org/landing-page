import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
vi.mock("../../config", () => ({ LANDING_BACKEND_URL: "https://synthetic.example.test", LANDING_BACKEND_API_KEY: "synthetic-key" }));
vi.mock("../../lib/http.js", () => ({ HttpApi: vi.fn() }));
vi.mock("../../lib/utils", () => ({ getCookie: vi.fn(async () => "synthetic-cookie") }));
import Service from "../leadRegistrationService.js";
import { HttpApi } from "../../lib/http.js";

const context = { solicitudId: "9007199254740993", captureSessionId: "11111111-1111-4111-8111-111111111111", baseRevision: "a".repeat(64) };
const options = { context, uploadId: "22222222-2222-4222-8222-222222222222", rotationFront: 90, rotationBack: 0 };
const files = () => ({ dniFront: new Blob(["front"], { type: "image/png" }), dniBack: new Blob(["back"], { type: "image/png" }) });
const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const receipt = { ...context, uploadId: options.uploadId, dniReceivedForSession: true, estado_onboarding: "DNI_SUBIDO", documentValidation: "not_performed" };

beforeEach(() => { vi.clearAllMocks(); HttpApi.mockResolvedValue(response({ success: true, data: receipt })); });
afterEach(() => vi.restoreAllMocks());

describe("DNI transport contract", () => {
  it("fetches readonly context with override and cancellation signal", async () => {
    const signal = new AbortController().signal;
    const contextData = { ...context, canCapture: true, estado_onboarding: "CELULAR_VALIDADO", dniReceivedForSession: false, receivedUploadId: null, receiptKind: "none" };
    HttpApi.mockResolvedValue(response({ success: true, data: contextData }));
    await expect(Service.obtenerContextoDni("42", { tokenOverride: "synthetic-link", signal })).resolves.toMatchObject({ data: contextData });
    expect(HttpApi).toHaveBeenCalledWith("https://synthetic.example.test/api/lead-registration/dni-contexto/42", null, "GET", "synthetic-key", "synthetic-link", signal);
  });
  it.each(["inline", "mobile"])("sends six context fields and PNG originals with constant filenames (%s)", async mode => {
    const signal = new AbortController().signal;
    const pair = files();
    if (mode === "inline") await Service.subirDni({ leadId: "42" }, pair, signal, { retries: 8 }, options);
    else await Service.subirDniMobile({ leadId: "42" }, pair, "synthetic-link", signal, { retries: 8 }, options);
    const [, form, method, , token, sentSignal, retry] = HttpApi.mock.calls[0];
    expect(method).toBe("POST");
    expect(token).toBe(mode === "inline" ? "synthetic-cookie" : "synthetic-link");
    expect(sentSignal).toBe(signal);
    expect(retry).toEqual({ retries: 0, timeoutMs: 90000 });
    expect([...form.keys()].sort()).toEqual(["baseRevision", "captureSessionId", "dniBack", "dniFront", "rotationBack", "rotationFront", "solicitudId", "uploadId"]);
    expect(form.get("solicitudId")).toBe("9007199254740993");
    expect(form.get("baseRevision")).toBe("a".repeat(64));
    expect(form.get("captureSessionId")).toBe(context.captureSessionId);
    expect(form.get("uploadId")).toBe(options.uploadId);
    expect(form.get("rotationFront")).toBe("90");
    expect(form.get("rotationBack")).toBe("0");
    expect(form.get("dniFront")).toMatchObject({ name: "dni-front.png", type: "image/png", size: 5 });
    expect(form.get("dniBack")).toMatchObject({ name: "dni-back.png", type: "image/png", size: 4 });
  });
  it("inline explicit token takes priority over cookie", async () => {
    await Service.subirDni({ leadId: "42" }, files(), null, null, { ...options, tokenOverride: "synthetic-prop" });
    expect(HttpApi.mock.calls[0][4]).toBe("synthetic-prop");
  });
  it("rejects context-free uploads before transport", async () => {
    await expect(Service.subirDni({ leadId: "42" }, files())).rejects.toMatchObject({ cause: "DNI_CAPTURE_CONTEXT_REQUIRED" });
    expect(HttpApi).not.toHaveBeenCalled();
  });
  it.each([
    [200, { success: false, status: 409, cause: "DNI_CAPTURE_CONTEXT_CHANGED" }, "DNI_CAPTURE_CONTEXT_CHANGED", 409],
    [404, { success: false, status: 200, cause: "DNI_CAPTURE_NOT_FOUND" }, "DNI_CAPTURE_NOT_FOUND", 404],
    [429, { success: false, cause: "DNI_UPLOAD_BUSY" }, "DNI_UPLOAD_BUSY", 429],
    [422, { success: false, cause: "DNI_IMAGE_INVALID", data: { side: "back" } }, "DNI_IMAGE_INVALID", 422],
    [503, { success: false, cause: "DNI_STORAGE_UNAVAILABLE" }, "DNI_STORAGE_UNAVAILABLE", 503],
    [500, { success: false, cause: "EXTERNAL_CAUSE" }, "DNI_TECHNICAL_ERROR", 502],
    [403, { success: false, cause: "DNI_CAPTURE_CONTEXT_CHANGED" }, "DNI_TECHNICAL_ERROR", 502],
  ])("normalizes status %i without external messages", async (status, body, cause, safeStatus) => {
    const logger = vi.spyOn(console, "error");
    HttpApi.mockResolvedValue(response({ ...body, message: "sensitive raw body" }, status));
    let error;
    try { await Service.subirDni({ leadId: "42" }, files(), null, null, options); } catch (caught) { error = caught; }
    expect(error).toMatchObject({ cause, status: safeStatus });
    expect(error.message).not.toContain("sensitive");
    expect(logger).not.toHaveBeenCalled();
  });
  it("uses safe 502 for HTML/malformed JSON without retaining syntax text", async () => {
    HttpApi.mockResolvedValue({ ok: false, status: 502, json: async () => { throw new SyntaxError("private HTML"); } });
    await expect(Service.obtenerContextoDni("42")).rejects.toMatchObject({ cause: "DNI_TECHNICAL_ERROR", status: 502 });
  });
  it("rejects legacy errors with no effective numeric status", async () => {
    HttpApi.mockResolvedValue(response({ success: false, cause: "DNI_CAPTURE_NOT_FOUND", message: "private" }));
    await expect(Service.obtenerContextoDni("42")).rejects.toMatchObject({ cause: "DNI_TECHNICAL_ERROR", status: 502 });
  });
  it("keeps cancellation silent and network retry explicit", async () => {
    HttpApi.mockRejectedValueOnce(new DOMException("private", "AbortError"));
    await expect(Service.subirDniMobile({ leadId: "42" }, files(), "synthetic", null, null, options)).rejects.toMatchObject({ name: "AbortError" });
    HttpApi.mockRejectedValueOnce(new TypeError("private network"));
    await expect(Service.subirDniMobile({ leadId: "42" }, files(), "synthetic", null, null, options)).rejects.toMatchObject({ cause: "DNI_NETWORK_ERROR", retryable: true });
    expect(HttpApi).toHaveBeenCalledTimes(2);
  });
});
