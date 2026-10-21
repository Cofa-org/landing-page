// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("../../../../utils/callbellHelpers", () => ({
  toggleCallbellWebchat: vi.fn(),
  openCallbellWebchat: vi.fn(),
}));

import { useEmailPendingAdvisor } from "../useEmailPendingAdvisor.js";
import { toggleCallbellWebchat, openCallbellWebchat } from "../../../../utils/callbellHelpers";

describe("useEmailPendingAdvisor (Plan 2026-10-09)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // El fix del bug e2e (2026-10-15): el hook debe ABRIR el chat, no solo
  // mostrar el botón flotante. `toggleCallbellWebchat(true)` solo agrega la
  // clase `hide-callbell` invertida en el body (visibilidad del widget);
  // `openCallbellWebchat()` es el que simula el click sobre el launcher
  // button del widget para abrir el panel de chat. Sin esta segunda
  // llamada, el usuario clickeaba "Comunicarse con un asesor" y solo veía
  // cómo aparecía (o nada) el botón flotante — el chat nunca se abría.
  //
  // Fix e2e 2026-10-15 (segundo round): el widget de Callbell ya está
  // visible en la pantalla del step advisor (el effect del
  // OnboardingFlowScreen lo deja visible para los steps no-terminales).
  // Por eso la implementación final del hook solo llama a
  // `openCallbellWebchat()` (sin el defensive `toggleCallbellWebchat(true)`
  // que el round anterior había agregado).
  it("handleContactAdvisor abre el chat vía openCallbellWebchat", () => {
    const { result } = renderHook(() => useEmailPendingAdvisor());

    act(() => {
      result.current.handleContactAdvisor();
    });

    expect(openCallbellWebchat).toHaveBeenCalledWith();
    expect(openCallbellWebchat).toHaveBeenCalledTimes(1);
    // Confirmamos que NO se llama a toggleCallbellWebchat — el widget
    // ya está visible por el effect del OnboardingFlowScreen.
    expect(toggleCallbellWebchat).not.toHaveBeenCalled();
  });

  it("returns a stable handleContactAdvisor reference across renders", () => {
    const { result, rerender } = renderHook(() => useEmailPendingAdvisor());
    const firstReference = result.current.handleContactAdvisor;

    rerender();

    expect(result.current.handleContactAdvisor).toBe(firstReference);
  });
});