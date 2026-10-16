// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { toggleCallbellWebchat, openCallbellWebchat } from "../callbellHelpers.js";

describe("toggleCallbellWebchat", () => {
  beforeEach(() => {
    document.body.classList.remove("hide-callbell");
  });

  it("isVisible=true → remueve la clase hide-callbell del body", () => {
    document.body.classList.add("hide-callbell");
    toggleCallbellWebchat(true);
    expect(document.body.classList.contains("hide-callbell")).toBe(false);
  });

  it("isVisible=false → agrega la clase hide-callbell al body", () => {
    toggleCallbellWebchat(false);
    expect(document.body.classList.contains("hide-callbell")).toBe(true);
  });

  it("es idempotente: llamar dos veces con el mismo arg no acumula", () => {
    toggleCallbellWebchat(true);
    toggleCallbellWebchat(true);
    expect(document.body.classList.contains("hide-callbell")).toBe(false);
  });
});

describe("openCallbellWebchat (Plan 2026-10-09 fix e2e)", () => {
  let host;
  let getElementByIdSpy;

  beforeEach(() => {
    vi.useFakeTimers();
    host = document.createElement("div");
    host.id = "callbell-livechat-host";
    document.body.appendChild(host);
    getElementByIdSpy = vi.spyOn(document, "getElementById").mockReturnValue(host);
  });

  afterEach(() => {
    document.body.removeChild(host);
    vi.useRealTimers();
    getElementByIdSpy.mockRestore();
  });

  it("clic inmediato al launcher button si ya está en el DOM", () => {
    const btn = document.createElement("button");
    btn.textContent = "Open chat";
    host.appendChild(btn);
    const clickSpy = vi.spyOn(btn, "click");

    openCallbellWebchat();

    expect(clickSpy).toHaveBeenCalledTimes(1);
    // No se programa ningún timer adicional (porque se encontró al primer intento)
    expect(vi.getTimerCount()).toBe(0);
  });

  it("polling: si el launcher no está, espera y vuelve a intentar", () => {
    // El helper actual hace 6 querySelector por iteración (uno por
    // selector en LAUNCHER_SELECTORS). Sin shadow root, la 1ª iteración
    // consume 6 calls, todas retornan null. La 2ª iteración consume 1
    // call (la 7ª total) que retornamos como btn → click.
    const btn = document.createElement("button");
    btn.textContent = "Open chat";
    const clickSpy = vi.spyOn(btn, "click");

    let callCount = 0;
    vi.spyOn(host, "querySelector").mockImplementation(() => {
      callCount += 1;
      if (callCount === 7) return btn; // 1ª call de la 2ª iteración
      return null;
    });

    openCallbellWebchat();

    // Inmediatamente: el polling programó un timer (porque el 1er intento falló).
    expect(vi.getTimerCount()).toBe(1);

    // Avanzamos el tiempo y disparamos el timer.
    vi.advanceTimersByTime(100);

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("agota los intentos y avisa vía console.warn si el host nunca aparece", () => {
    getElementByIdSpy.mockReturnValue(null);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    openCallbellWebchat();

    // 30 intentos × 100ms = 3000ms.
    vi.advanceTimersByTime(3100);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("host not found"),
    );
  });

  it("agota los intentos y avisa si el host aparece pero sin launcher", () => {
    vi.spyOn(host, "querySelector").mockReturnValue(null);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    openCallbellWebchat();

    vi.advanceTimersByTime(3100);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("launcher button not found"),
    );
  });

  it("Plan 2026-10-15 (e2e fix v2): busca dentro de shadow DOM del host", () => {
    // El widget moderno de Callbell encapsula el launcher en un shadow
    // root. querySelector no penetra shadow roots por default; nuestro
    // helper debe descender al shadowRoot.
    const btn = document.createElement("button");
    btn.textContent = "Open chat";
    const clickSpy = vi.spyOn(btn, "click");

    const shadow = document.createElement("div");
    shadow.appendChild(btn);
    Object.defineProperty(host, "shadowRoot", {
      configurable: true,
      get: () => shadow,
    });

    openCallbellWebchat();

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("el warning final loguea info de diagnóstico del host (children + shadow + preview)", () => {
    vi.spyOn(host, "querySelector").mockReturnValue(null);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Agregamos un child al host para que el preview tenga contenido.
    const child = document.createElement("div");
    child.id = "test-child";
    host.appendChild(child);

    openCallbellWebchat();
    vi.advanceTimersByTime(3100);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("host children=1"),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("hasShadowRoot=false"),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("test-child"),
    );
  });
});
