// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import LeadRegistrationService from "../leadRegistrationService";

describe("LeadRegistrationService.phonePickerPick", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  it("POST a /phone-picker-pick con opcionElegida, devuelve data normalizado", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            estado: "VALIDADO",
            decision: { estado: "DNI_SUBIDO" },
          },
        }),
    };
    global.fetch.mockResolvedValue(mockResponse);

    const result = await LeadRegistrationService.phonePickerPick({
      opcionElegida: "1144445555",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/phone-picker-pick"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ opcionElegida: "1144445555" }),
      }),
    );
    expect(result.success).toBe(true);
    expect(result.data.estado).toBe("VALIDADO");
  });

  it("retorna { success:false, error: 'PHONE_PICKER_ALREADY_ATTEMPTED' } cuando el back ya rechazó por segunda intentona", async () => {
    const mockResponse = {
      ok: true, // back siempre responde 200; el error viene en el body
      json: () =>
        Promise.resolve({
          success: false,
          error: "PHONE_PICKER_ALREADY_ATTEMPTED",
        }),
    };
    global.fetch.mockResolvedValue(mockResponse);

    const result = await LeadRegistrationService.phonePickerPick({
      opcionElegida: "1144445555",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("PHONE_PICKER_ALREADY_ATTEMPTED");
  });

  it("retorna cause: 'OPCION_REQUERIDA' cuando el validator rechaza (400)", async () => {
    const mockResponse = {
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({
          message: "opción requerida",
          cause: "OPCION_REQUERIDA",
        }),
    };
    global.fetch.mockResolvedValue(mockResponse);

    await expect(
      LeadRegistrationService.phonePickerPick({ opcionElegida: "" }),
    ).rejects.toMatchObject({ cause: "OPCION_REQUERIDA" });
  });
});

describe("LeadRegistrationService.iniciarSesionResume (recibo-resubida-operador 2026-09-07)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  it("success → POST a /api/lead-registration/resume-init con {leadId, shortId} y retorna data normalizado", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            leadToken: "jwt-fake-token",
            leadId: 42,
            es_cliente: false,
            celular: "1144445555",
            maxSlots: 3,
            estadoOnboarding: "RECIBO_SUBIDO",
          },
        }),
    };
    global.fetch.mockResolvedValue(mockResponse);

    const result = await LeadRegistrationService.iniciarSesionResume({
      leadId: 42,
      shortId: "abc",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/lead-registration/resume-init"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ leadId: 42, shortId: "abc" }),
      }),
    );
    expect(result.success).toBe(true);
    expect(result.data.leadToken).toBe("jwt-fake-token");
    expect(result.data.leadId).toBe(42);
    expect(result.data.maxSlots).toBe(3);
  });

  it("success → si el back devuelve maxSlots=6, propaga el valor al caller", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            leadToken: "jwt-fake-token",
            leadId: 99,
            es_cliente: false,
            celular: "1144445555",
            maxSlots: 6,
            estadoOnboarding: "RECIBO_SUBIDO",
          },
        }),
    };
    global.fetch.mockResolvedValue(mockResponse);

    const result = await LeadRegistrationService.iniciarSesionResume({
      leadId: 99,
      shortId: "abc",
    });

    expect(result.data.maxSlots).toBe(6);
  });

  it("back tira 400 con cause LINK_INVALID → propaga Error con cause", async () => {
    const mockResponse = {
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({
          message: "Link inválido o expirado",
          cause: "LINK_INVALID_OR_EXPIRED",
        }),
    };
    global.fetch.mockResolvedValue(mockResponse);

    await expect(
      LeadRegistrationService.iniciarSesionResume({ leadId: 42, shortId: "abc" }),
    ).rejects.toMatchObject({
      message: expect.stringMatching(/inválido|expirado/i),
      cause: "LINK_INVALID_OR_EXPIRED",
    });
  });

  it("network failure (TypeError) → propaga el error sin envolver", async () => {
    global.fetch.mockRejectedValue(new TypeError("Failed to fetch"));

    // El servicio NO pasa retryConfig (default null), entonces HttpApi NO
    // envuelve en NetworkError — propaga el TypeError crudo.
    await expect(
      LeadRegistrationService.iniciarSesionResume({ leadId: 42, shortId: "abc" }),
    ).rejects.toBeInstanceOf(TypeError);
  });

  it("incluye Authorization header sólo si token presente (resume no envía token, así que NO)", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ success: true, data: { leadToken: "x" } }),
    };
    global.fetch.mockResolvedValue(mockResponse);

    await LeadRegistrationService.iniciarSesionResume({ leadId: 42, shortId: "abc" });

    // HttpApi sólo agrega Authorization si el token no es falsy. resume no
    // lee cookie (no hay cookie aún — el link es anónimo), así que NO
    // debería mandar Bearer.
    const fetchOpts = global.fetch.mock.calls[0][1];
    expect(fetchOpts.headers.Authorization).toBeUndefined();
  });
});
