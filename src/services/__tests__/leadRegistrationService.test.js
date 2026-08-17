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
