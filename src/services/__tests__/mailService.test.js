// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import MailService from "../mailService";

class MockXHR {
  constructor() {
    this.method = null;
    this.url = null;
    this.requestHeaders = {};
    this.body = null;
    this.timeout = 0;
    this.responseText = "";
    this.status = 0;
    this.listeners = {};
    this._responseHeaders = null;
  }
  open(method, url) { this.method = method; this.url = url; }
  setRequestHeader(key, value) { this.requestHeaders[key] = value; }
  send(body) { this.body = body; }
  abort() { this._fire("abort"); }
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
}

describe("MailService.sendMail", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.XMLHttpRequest = MockXHR;
    global.localStorage = { getItem: vi.fn().mockReturnValue(null) };
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("happy path: 200 + application/json → parsea JSON y retorna message", async () => {
    const xhrInstances = [];
    vi.spyOn(global, "XMLHttpRequest").mockImplementation(function () {
      const xhr = new MockXHR();
      xhrInstances.push(xhr);
      return xhr;
    });

    const fd = new FormData();
    fd.append("name", "John");
    fd.append("email", "john@example.com");

    const promise = MailService.sendMail("contacto", fd);
    xhrInstances[0]._triggerLoad(
      200,
      '{"message":"ok","data":{"id":1}}',
      { "Content-Type": "application/json" }
    );
    const result = await promise;

    expect(result).toEqual({ message: "ok", data: { id: 1 } });
    expect(xhrInstances).toHaveLength(1);
  });

  it("text/plain response: usa response.text() como fallback", async () => {
    const xhrInstances = [];
    vi.spyOn(global, "XMLHttpRequest").mockImplementation(function () {
      const xhr = new MockXHR();
      xhrInstances.push(xhr);
      return xhr;
    });

    const fd = new FormData();
    const promise = MailService.sendMail("contacto", fd);
    xhrInstances[0]._triggerLoad(
      500,
      "Internal Server Error plain text",
      { "Content-Type": "text/plain" }
    );

    await expect(promise).rejects.toThrow(/Internal Server Error plain text/);
  });

  it("response.headers.get('content-type') funciona en path XHR", async () => {
    const xhrInstances = [];
    vi.spyOn(global, "XMLHttpRequest").mockImplementation(function () {
      const xhr = new MockXHR();
      xhrInstances.push(xhr);
      return xhr;
    });

    const fd = new FormData();
    const promise = MailService.sendMail("contacto", fd);
    xhrInstances[0]._triggerLoad(
      200,
      '{"message":"ok"}',
      { "Content-Type": "application/json", "X-Custom": "test" }
    );
    const result = await promise;

    expect(result.message).toBe("ok");
  });
});
