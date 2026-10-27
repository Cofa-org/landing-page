// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePendingCbuValidation } from "../usePendingCbuValidation.js";

const openCallbellMock = vi.fn();
vi.mock("../../../../utils/callbellHelpers.js", () => ({
  openCallbellWebchat: (...args) => openCallbellMock(...args),
}));

describe("usePendingCbuValidation (Plan 2026-10-20)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("expone handleContactAdvisor", () => {
    const { result } = renderHook(() => usePendingCbuValidation());
    expect(typeof result.current.handleContactAdvisor).toBe("function");
  });

  it("handleContactAdvisor abre el chat de Callbell", () => {
    const { result } = renderHook(() => usePendingCbuValidation());
    result.current.handleContactAdvisor();
    expect(openCallbellMock).toHaveBeenCalledTimes(1);
  });

  it("handleContactAdvisor no propaga errores al caller", () => {
    // Convención del repo (ver src/utils/__tests__/callbellHelpers.test.js):
    // silenciar el `console.warn` esperado para que el output del test sea
    // limpio. Además se verifica que el error NO se traga en silencio.
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    openCallbellMock.mockImplementation(() => {
      throw new Error("boom");
    });
    const { result } = renderHook(() => usePendingCbuValidation());
    expect(() => result.current.handleContactAdvisor()).not.toThrow();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
    // `vi.clearAllMocks()` no resetea la implementación: se limpia explícitamente
    // para que el test no dependa del orden de ejecución.
    openCallbellMock.mockReset();
  });
});
