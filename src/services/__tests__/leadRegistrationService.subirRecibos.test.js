import { vi, describe, it, expect, beforeEach } from "vitest";
import LeadRegistrationService from "../leadRegistrationService.js";
import { HttpApi } from "../../lib/http.js";
import { getCookie } from "../../lib/utils";

vi.mock("../../lib/http.js", () => ({ HttpApi: vi.fn() }));
vi.mock("../../lib/utils", () => ({ getCookie: vi.fn() }));

describe("LeadRegistrationService.subirRecibos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCookie.mockResolvedValue("tok");
  });

  it("posts files[] and orden[] in parallel", async () => {
    HttpApi.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { recibos: [] } }),
    });
    const f1 = new File(["a"], "a.pdf", { type: "application/pdf" });
    const f2 = new File(["b"], "b.pdf", { type: "application/pdf" });
    await LeadRegistrationService.subirRecibos(
      { leadId: 7 },
      { 1: f1, 2: f2 },
    );
    expect(HttpApi).toHaveBeenCalledTimes(1);
    const call = HttpApi.mock.calls[0];
    expect(call[0]).toMatch(/\/api\/lead-registration\/subir-recibos\/7$/);
    const form = call[1];
    expect(form).toBeInstanceOf(FormData);
    expect([...form.getAll("files")]).toEqual([f1, f2]);
    expect([...form.getAll("orden")]).toEqual(["1", "2"]);
  });

  it("throws with cause on !response.ok", async () => {
    HttpApi.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "x", cause: "MAX_RECIBOS_ALCANZADO" }),
    });
    await expect(
      LeadRegistrationService.subirRecibos({ leadId: 7 }, { 1: new File([], "x") }),
    ).rejects.toMatchObject({
      message: "x",
      cause: "MAX_RECIBOS_ALCANZADO",
    });
  });

  it("throws when no files provided", async () => {
    await expect(
      LeadRegistrationService.subirRecibos({ leadId: 7 }, {}),
    ).rejects.toThrow(/Al menos un recibo/);
  });
});

describe("LeadRegistrationService.getRecibosPendientes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCookie.mockResolvedValue("tok");
  });

  it("returns data array on success", async () => {
    HttpApi.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [{ orden: 1 }] }),
    });
    const data = await LeadRegistrationService.getRecibosPendientes(7);
    expect(data).toEqual([{ orden: 1 }]);
  });
});

describe("LeadRegistrationService.eliminarRecibo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCookie.mockResolvedValue("tok");
  });

  it("returns success true on 200", async () => {
    HttpApi.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });
    const result = await LeadRegistrationService.eliminarRecibo("uuid-abc");
    expect(result).toEqual({ success: true });
  });
});