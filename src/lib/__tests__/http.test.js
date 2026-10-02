/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HttpApi } from "../http";
import { NetworkError } from "../network-error";

function buildResponse(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  };
}

class MockXHR {
  constructor() {
    this.method = null;
    this.url = null;
    this.requestHeaders = {};
    this.body = null;
    this.timeout = 0;
    this.responseText = "";
    this.status = 0;
    this.signal = null;
    this.listeners = {};
  }
  open(method, url) {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(key, value) {
    this.requestHeaders[key] = value;
  }
  send(body) {
    this.body = body;
  }
  abort() {
    this._fire("abort");
  }
  addEventListener(event, listener) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(listener);
  }
  getAllResponseHeaders() {
    if (!this._responseHeaders) return "";
    return Object.entries(this._responseHeaders)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\r\n");
  }
  _fire(event) {
    const fn = this[`on${event}`];
    if (typeof fn === "function") fn();
  }
  _triggerLoad(status, bodyText, responseHeaders) {
    this.status = status;
    this.responseText = bodyText;
    this._responseHeaders = responseHeaders || null;
    this._fire("load");
  }
  _triggerError(status = 0) {
    this.status = status;
    this._fire("error");
  }
  _triggerTimeout() {
    this._fire("timeout");
  }
}

describe("HttpApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.XMLHttpRequest = MockXHR;
    global.localStorage = {
      getItem: vi.fn().mockReturnValue(null),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetch first attempt success returns response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(buildResponse(200, { ok: true }));
    global.fetch = fetchMock;
    const result = await HttpApi(
      "https://example.com/api",
      { foo: "bar" },
      "POST",
      "key",
      "tok"
    );
    expect(result.status).toBe(200);
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retry on TypeError from fetch with retries=1", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("NetworkError"))
      .mockResolvedValueOnce(buildResponse(200, { ok: true }));
    global.fetch = fetchMock;
    const result = await HttpApi(
      "https://example.com/api",
      { foo: "bar" },
      "POST",
      "key",
      "tok",
      null,
      { retries: 1, backoffMs: 0 }
    );
    expect(result.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("FormData routes through XMLHttpRequest, not fetch", async () => {
    const form = new FormData();
    form.append("file", "test");
    const xhrInstances = [];
    vi.spyOn(global, "XMLHttpRequest").mockImplementation(function () {
      const xhr = new MockXHR();
      xhrInstances.push(xhr);
      return xhr;
    });
    const fetchMock = vi.fn();
    global.fetch = fetchMock;
    const promise = HttpApi(
      "https://example.com/upload",
      form,
      "POST",
      "key",
      "tok"
    );
    xhrInstances[0]._triggerLoad(200, '{"uploaded":true}');
    const result = await promise;
    expect(result.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(xhrInstances).toHaveLength(1);
  });

  it("XHR onload 2xx resolves with status, ok, and parsed JSON", async () => {
    const form = new FormData();
    const xhrInstances = [];
    vi.spyOn(global, "XMLHttpRequest").mockImplementation(function () {
      const xhr = new MockXHR();
      xhrInstances.push(xhr);
      return xhr;
    });
    global.fetch = vi.fn();
    const promise = HttpApi(
      "https://example.com/upload",
      form,
      "POST",
      "key",
      "tok"
    );
    xhrInstances[0]._triggerLoad(200, '{"result":"ok"}');
    const result = await promise;
    expect(result.status).toBe(200);
    expect(result.ok).toBe(true);
    const body = await result.json();
    expect(body).toEqual({ result: "ok" });
  });

  it("XHR response expone response.headers (Headers object) para mailService compatibility", async () => {
    const form = new FormData();
    const xhrInstances = [];
    vi.spyOn(global, "XMLHttpRequest").mockImplementation(function () {
      const xhr = new MockXHR();
      xhrInstances.push(xhr);
      return xhr;
    });
    global.fetch = vi.fn();
    const promise = HttpApi(
      "https://example.com/mail/contact",
      form,
      "POST",
      "key",
      "tok"
    );
    xhrInstances[0]._triggerLoad(200, "{}", {
      "Content-Type": "application/json",
      "X-Custom": "value",
    });
    const result = await promise;
    expect(result.headers).toBeDefined();
    expect(result.headers.get("content-type")).toBe("application/json");
    expect(result.headers.get("x-custom")).toBe("value");
  });

  it("XHR response expone response.text() para mailService fallback path", async () => {
    const form = new FormData();
    const xhrInstances = [];
    vi.spyOn(global, "XMLHttpRequest").mockImplementation(function () {
      const xhr = new MockXHR();
      xhrInstances.push(xhr);
      return xhr;
    });
    global.fetch = vi.fn();
    const promise = HttpApi(
      "https://example.com/mail/contact",
      form,
      "POST",
      "key",
      "tok"
    );
    xhrInstances[0]._triggerLoad(500, "Internal Server Error plain text");
    const result = await promise;
    const text = await result.text();
    expect(text).toBe("Internal Server Error plain text");
  });

  it("XHR onerror with status 0 triggers retry, second attempt succeeds", async () => {
    const form = new FormData();
    const xhrInstances = [];
    vi.spyOn(global, "XMLHttpRequest").mockImplementation(function () {
      const xhr = new MockXHR();
      xhrInstances.push(xhr);
      return xhr;
    });
    global.fetch = vi.fn();
    const promise = HttpApi(
      "https://example.com/upload",
      form,
      "POST",
      "key",
      "tok",
      null,
      { retries: 1, backoffMs: 0 }
    );
    xhrInstances[0]._triggerError(0);
    // Allow HttpApi to catch the error and retry (setTimeout(0) fires next tick with real timers)
    await new Promise((r) => setTimeout(r, 10));
    expect(xhrInstances).toHaveLength(2);
    xhrInstances[1]._triggerLoad(200, '{"recovered":true}');
    const result = await promise;
    expect(result.status).toBe(200);
    const body = await result.json();
    expect(body).toEqual({ recovered: true });
  });

  it("XHR second attempt succeeds after first failure with retries=2", async () => {
    const form = new FormData();
    const xhrInstances = [];
    vi.spyOn(global, "XMLHttpRequest").mockImplementation(function () {
      const xhr = new MockXHR();
      xhrInstances.push(xhr);
      return xhr;
    });
    global.fetch = vi.fn();
    const promise = HttpApi(
      "https://example.com/upload",
      form,
      "POST",
      "key",
      "tok",
      null,
      { retries: 2, backoffMs: 0 }
    );
    xhrInstances[0]._triggerError(0);
    await new Promise((r) => setTimeout(r, 10));
    expect(xhrInstances).toHaveLength(2);
    xhrInstances[1]._triggerLoad(200, '{"second":"ok"}');
    const result = await promise;
    expect(result.status).toBe(200);
    const body = await result.json();
    expect(body).toEqual({ second: "ok" });
  });

  it("XHR does not set Content-Type header for FormData (browser auto-generates)", async () => {
    const form = new FormData();
    let xhr;
    vi.spyOn(global, "XMLHttpRequest").mockImplementation(function () {
      xhr = new MockXHR();
      return xhr;
    });
    global.fetch = vi.fn();
    const promise = HttpApi(
      "https://example.com/upload",
      form,
      "POST",
      "key",
      "tok"
    );
    xhr._triggerLoad(200, "{}");
    await promise;
    expect(xhr.requestHeaders["Content-Type"]).toBeUndefined();
    expect(xhr.requestHeaders["x-api-key"]).toBe("key");
    expect(xhr.requestHeaders["Authorization"]).toBe("Bearer tok");
  });

  it("fetch timeoutMs:5000 → TimeoutError dispara retry", async () => {
    const timeoutErr = new DOMException("timeout", "TimeoutError");
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(timeoutErr)
      .mockResolvedValueOnce(buildResponse(200, { recovered: true }));
    global.fetch = fetchMock;
    const promise = HttpApi(
      "https://example.com/api",
      { foo: "bar" },
      "POST",
      "key",
      "tok",
      null,
      { retries: 1, backoffMs: 0, timeoutMs: 5000 }
    );
    await new Promise((r) => setTimeout(r, 10));
    const result = await promise;
    expect(result.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("XHR timeout=75000 propagates to xhr.timeout", async () => {
    const form = new FormData();
    let xhr;
    vi.spyOn(global, "XMLHttpRequest").mockImplementation(function () {
      xhr = new MockXHR();
      return xhr;
    });
    global.fetch = vi.fn();
    const promise = HttpApi(
      "https://example.com/upload",
      form,
      "POST",
      "key",
      "tok",
      null,
      { retries: 0, timeoutMs: 75000 }
    );
    xhr._triggerLoad(200, "{}");
    await promise;
    expect(xhr.timeout).toBe(75000);
  });

  it("default retryConfig=null does not set xhr.timeout (timeout stays 0)", async () => {
    const form = new FormData();
    let xhr;
    vi.spyOn(global, "XMLHttpRequest").mockImplementation(function () {
      xhr = new MockXHR();
      return xhr;
    });
    global.fetch = vi.fn();
    const promise = HttpApi(
      "https://example.com/upload",
      form,
      "POST",
      "key",
      "tok"
    );
    xhr._triggerLoad(200, "{}");
    await promise;
    expect(xhr.timeout).toBe(0);
  });

  it("invalid timeoutMs=-1 is ignored (treated as 0, no timeout applied)", async () => {
    const form = new FormData();
    let xhr;
    vi.spyOn(global, "XMLHttpRequest").mockImplementation(function () {
      xhr = new MockXHR();
      return xhr;
    });
    global.fetch = vi.fn();
    const promise = HttpApi(
      "https://example.com/upload",
      form,
      "POST",
      "key",
      "tok",
      null,
      { retries: 0, timeoutMs: -1 }
    );
    xhr._triggerLoad(200, "{}");
    await promise;
    expect(xhr.timeout).toBe(0);
  });

  it("XHR ontimeout retries as TimeoutError (DOMException)", async () => {
    const form = new FormData();
    const xhrInstances = [];
    vi.spyOn(global, "XMLHttpRequest").mockImplementation(function () {
      const xhr = new MockXHR();
      xhrInstances.push(xhr);
      return xhr;
    });
    global.fetch = vi.fn();
    const promise = HttpApi(
      "https://example.com/upload",
      form,
      "POST",
      "key",
      "tok",
      null,
      { retries: 1, backoffMs: 0, timeoutMs: 5000 }
    );
    xhrInstances[0]._triggerTimeout();
    await new Promise((r) => setTimeout(r, 10));
    expect(xhrInstances).toHaveLength(2);
    xhrInstances[1]._triggerLoad(200, '{"after_timeout":true}');
    const result = await promise;
    expect(result.status).toBe(200);
    const body = await result.json();
    expect(body).toEqual({ after_timeout: true });
  });
});