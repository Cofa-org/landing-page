/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useOTPValidation } from "../useOTPValidation.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useOTPValidation con storage bloqueado por el browser", () => {
  it("no lanza al montar y aplica el cooldown sólo en memoria", async () => {
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new DOMException(
        "Failed to read the 'localStorage' property from 'Window': Access is denied for this document.",
        "SecurityError",
      );
    });
    const onResend = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useOTPValidation({ destination: "cliente@example.test", onResend })
    );

    await act(async () => {
      await result.current.handleResendClick();
    });

    expect(onResend).toHaveBeenCalledWith("cliente@example.test");
    expect(result.current.cooldown).toBe(120);
  });
});
