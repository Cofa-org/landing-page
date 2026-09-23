// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isFragileUploadBrowser } from "../fragile-upload-browsers";

function setUA(ua) {
  Object.defineProperty(window, "navigator", {
    value: { userAgent: ua },
    configurable: true,
  });
}

describe("isFragileUploadBrowser", () => {
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

  it("detecta Samsung Internet", () => {
    setUA(
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/30.0 Chrome/143.0.0.0 Mobile Safari/537.36"
    );
    expect(isFragileUploadBrowser()).toBe(true);
  });

  it("detecta WhatsApp in-app Android", () => {
    setUA(
      "Mozilla/5.0 (Linux; Android 14; SM-A065M Build/UP1A.231005.007; ) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/152.0.7977.87 Mobile Safari/537.36 WA4A/2.26.36.74"
    );
    expect(isFragileUploadBrowser()).toBe(true);
  });

  it("detecta Facebook in-app", () => {
    setUA(
      "Mozilla/5.0 (Linux; Android 15; Infinix X6725 Build/AP3A.240905.015.A2) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/153.0.8010.33 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/578.0.0.40.75;IABMV/1;]"
    );
    expect(isFragileUploadBrowser()).toBe(true);
  });

  it("detecta Instagram in-app", () => {
    setUA(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 Instagram 123.0.0.21.114"
    );
    expect(isFragileUploadBrowser()).toBe(true);
  });

  it("detecta UC Browser", () => {
    setUA(
      "Mozilla/5.0 (Linux; U; Android 10; en-US; UCBrowser/13.4.0.1306) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/74.0.3729.157 Mobile Safari/537.36"
    );
    expect(isFragileUploadBrowser()).toBe(true);
  });

  it("detecta MIUI Browser", () => {
    setUA(
      "Mozilla/5.0 (Linux; U; Android 10; zh-cn; MiuiBrowser/12.5.1) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/80.0.3987.132 Mobile Safari/537.36"
    );
    expect(isFragileUploadBrowser()).toBe(true);
  });

  it("detecta Huawei Browser", () => {
    setUA(
      "Mozilla/5.0 (Linux; Android 10; HUAWEI MLA-L29) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/74.0.3729.186 Mobile Safari/537.36 HBrowser/2.0.0.301"
    );
    expect(isFragileUploadBrowser()).toBe(true);
  });

  it("detecta Android 5-8 legacy", () => {
    setUA(
      "Mozilla/5.0 (Linux; Android 7.0; SM-G935F Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Mobile Safari/537.36"
    );
    expect(isFragileUploadBrowser()).toBe(true);
  });

  it("NO detecta Chrome moderno en Android 10", () => {
    setUA(
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36"
    );
    expect(isFragileUploadBrowser()).toBe(false);
  });

  it("NO detecta iOS Safari moderno", () => {
    setUA(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1"
    );
    expect(isFragileUploadBrowser()).toBe(false);
  });

  it("NO detecta Chrome desktop", () => {
    setUA(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36"
    );
    expect(isFragileUploadBrowser()).toBe(false);
  });

  it("NO detecta Android 9 con Chrome moderno", () => {
    setUA(
      "Mozilla/5.0 (Linux; Android 9; SM-G960F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
    );
    expect(isFragileUploadBrowser()).toBe(false);
  });

  it("retorna false si navigator es undefined (SSR)", () => {
    const origNavigator = global.navigator;
    delete global.navigator;
    try {
      expect(isFragileUploadBrowser()).toBe(false);
    } finally {
      global.navigator = origNavigator;
    }
  });

  it("retorna false si navigator.userAgent es vacío", () => {
    setUA("");
    expect(isFragileUploadBrowser()).toBe(false);
  });
});