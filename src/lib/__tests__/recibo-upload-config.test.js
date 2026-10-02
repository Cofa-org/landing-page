// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getSubirRecibosRetryConfig,
  SUBIR_RECIBOS_RETRY_CONFIG_BASE,
  SUBIR_RECIBOS_RETRY_CONFIG_FRAGILE,
} from "../recibo-upload-config";

function setUA(ua) {
  Object.defineProperty(window, "navigator", {
    value: { userAgent: ua },
    configurable: true,
  });
}

describe("getSubirRecibosRetryConfig", () => {
  let originalNavigator;
  beforeEach(() => {
    originalNavigator = window.navigator;
  });
  afterEach(() => {
    Object.defineProperty(window, "navigator", {
      value: originalNavigator,
      configurable: true,
    });
  });

  it("devuelve config frágil cuando el browser es Samsung Internet", () => {
    setUA(
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/30.0 Chrome/143.0.0.0 Mobile Safari/537.36"
    );
    expect(getSubirRecibosRetryConfig()).toEqual({
      retries: 3,
      backoffMs: 3000,
      timeoutMs: 90000,
    });
  });

  it("devuelve config frágil para WhatsApp in-app", () => {
    setUA(
      "Mozilla/5.0 (Linux; Android 14; SM-A065M) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/152.0.0.0 Mobile Safari/537.36 WA4A/2.26.36.74"
    );
    expect(getSubirRecibosRetryConfig()).toBe(SUBIR_RECIBOS_RETRY_CONFIG_FRAGILE);
  });

  it("devuelve config base para Chrome moderno en Android 10", () => {
    setUA(
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36"
    );
    expect(getSubirRecibosRetryConfig()).toBe(SUBIR_RECIBOS_RETRY_CONFIG_BASE);
  });

  it("devuelve config base para iOS Safari moderno", () => {
    setUA(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1"
    );
    expect(getSubirRecibosRetryConfig()).toBe(SUBIR_RECIBOS_RETRY_CONFIG_BASE);
  });

  it("devuelve config base para Chrome desktop", () => {
    setUA(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36"
    );
    expect(getSubirRecibosRetryConfig()).toBe(SUBIR_RECIBOS_RETRY_CONFIG_BASE);
  });

  it("SUBIR_RECIBOS_RETRY_CONFIG_BASE tiene los 3 campos esperados", () => {
    expect(SUBIR_RECIBOS_RETRY_CONFIG_BASE).toEqual({
      retries: 1,
      backoffMs: 1500,
      timeoutMs: 60000,
    });
  });

  it("SUBIR_RECIBOS_RETRY_CONFIG_FRAGILE tiene los 3 campos esperados", () => {
    expect(SUBIR_RECIBOS_RETRY_CONFIG_FRAGILE).toEqual({
      retries: 3,
      backoffMs: 3000,
      timeoutMs: 90000,
    });
  });

  it("devuelve config frágil para Facebook in-app", () => {
    setUA(
      "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/578.0.0.40.75]"
    );
    expect(getSubirRecibosRetryConfig()).toBe(SUBIR_RECIBOS_RETRY_CONFIG_FRAGILE);
  });
});
