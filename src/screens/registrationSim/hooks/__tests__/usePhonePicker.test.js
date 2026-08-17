// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("../../../../services/leadRegistrationService.js", () => ({
  __esModule: true,
  default: {
    phonePickerPick: vi.fn(),
  },
}));

import LeadRegistrationService from "../../../../services/leadRegistrationService.js";
import { usePhonePicker } from "../usePhonePicker.js";

describe("usePhonePicker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("estado inicial: submitting=false, error=null", () => {
    const { result } = renderHook(() => usePhonePicker());
    expect(result.current.submitting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("submitPick happy path: success={true, data:{estado,decision}}", async () => {
    LeadRegistrationService.phonePickerPick.mockResolvedValue({
      success: true,
      data: { estado: "VALIDADO", decision: { estado: "DNI_SUBIDO" } },
    });
    const { result } = renderHook(() => usePhonePicker());

    let returned;
    await act(async () => {
      returned = await result.current.submitPick("1144445555");
    });

    expect(returned.success).toBe(true);
    expect(returned.data.estado).toBe("VALIDADO");
    expect(result.current.submitting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("submitPick ALREADY_ATTEMPTED: returns error obj (no throw), sets error state", async () => {
    LeadRegistrationService.phonePickerPick.mockResolvedValue({
      success: false,
      error: "PHONE_PICKER_ALREADY_ATTEMPTED",
    });
    const { result } = renderHook(() => usePhonePicker());

    let returned;
    await act(async () => {
      returned = await result.current.submitPick("1144445555");
    });

    expect(returned.success).toBe(false);
    expect(returned.error).toBe("PHONE_PICKER_ALREADY_ATTEMPTED");
    expect(result.current.error).toMatch(/ya.*verific|ya intentaste/i);
  });

  it("submitPick con causa 4xx (OPCION_REQUERIDA): throws", async () => {
    const thrown = new Error("opción requerida");
    thrown.cause = "OPCION_REQUERIDA";
    LeadRegistrationService.phonePickerPick.mockRejectedValue(thrown);
    const { result } = renderHook(() => usePhonePicker());

    await act(async () => {
      await expect(result.current.submitPick("")).rejects.toMatchObject({ cause: "OPCION_REQUERIDA" });
    });
  });

  it("submitPick con error de red: surface as error state, no throw", async () => {
    LeadRegistrationService.phonePickerPick.mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => usePhonePicker());

    let returned;
    await act(async () => {
      returned = await result.current.submitPick("1144445555");
    });

    expect(returned).toBeUndefined();
    expect(result.current.error).toMatch(/error.*comunic|volvé a intentar/i);
  });

  it("durante submitPick: submitting=true hasta resolver", async () => {
    let resolve;
    LeadRegistrationService.phonePickerPick.mockImplementation(
      () => new Promise((r) => { resolve = r; }),
    );
    const { result } = renderHook(() => usePhonePicker());

    let p;
    act(() => { p = result.current.submitPick("1144445555"); });

    expect(result.current.submitting).toBe(true);

    await act(async () => {
      resolve({ success: true, data: { estado: "VALIDADO" } });
      await p;
    });

    expect(result.current.submitting).toBe(false);
  });
});
