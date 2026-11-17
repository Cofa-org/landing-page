import { expect, test, vi } from "vitest";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";
import { createUnitNetworkGuard, UNIT_NETWORK_GUARD_MARKER } from "../unit-network-guard.js";

// Observe the boundary before importing application code, not in a beforeEach.
const guardBeforeApplicationImport = {
  ready: globalThis[UNIT_NETWORK_GUARD_MARKER],
  wrapped: [fetch, XMLHttpRequest.prototype.open, http.request, http.get, https.request, https.get, net.connect, net.createConnection, tls.connect]
    .every(method => method[UNIT_NETWORK_GUARD_MARKER] === true),
};
const { LANDING_BACKEND_URL, LANDING_BACKEND_API_KEY, LRS_URL, LRS_API_KEY, TURNSTILE_SITE_KEY, THUMBMARKJS_API_KEY, SISTEMA_FRANCES_ON, DEV, ENABLE_TEST_PERSONAS } = await import("../../config.js");
const importTimeProof = {
  ...guardBeforeApplicationImport,
  configuration: { LANDING_BACKEND_URL, LANDING_BACKEND_API_KEY, LRS_URL, LRS_API_KEY, TURNSTILE_SITE_KEY, THUMBMARKJS_API_KEY, SISTEMA_FRANCES_ON, DEV, ENABLE_TEST_PERSONAS },
};

test.each([
  ["fetch", ["https://provider.invalid/private"]],
  ["http", ["http://provider.invalid/private"]],
  ["http", [{ hostname: "provider.invalid", port: 443 }]],
  ["socket", [443, "provider.invalid"]],
  ["socket", [{ host: "provider.invalid", port: 443 }]],
  ["xhr", ["POST", "https://provider.invalid/private"]],
  ["http", ["http://127.0.0.1", { hostname: "provider.invalid" }]],
  ["fetch", ["https://localhost@provider.invalid/private"]],
  ["fetch", ["https://127.0.0.1.provider.invalid/private"]],
])("%s rejects external targets before invoking any transport", (kind, args) => {
  // A fake delegate keeps RED/mutation proofs unable to perform actual I/O.
  const delegate = vi.fn();
  const guarded = createUnitNetworkGuard(delegate, kind);
  expect(() => guarded(...args)).toThrow("UNIT_EXTERNAL_NETWORK_BLOCKED");
  expect(delegate).not.toHaveBeenCalled();
});

test.each([
  ["fetch", ["http://127.0.0.1:43117/fixture"]],
  ["fetch", ["/fixture"]],
  ["fetch", [{ url: "http://localhost:43117/fixture" }]],
  ["http", [new URL("http://[::1]:43117/fixture")]],
  ["http", [{ hostname: "localhost", port: 43117 }]],
  ["socket", [43117, "127.0.0.1"]],
  ["socket", [{ host: "::1", port: 43117 }]],
  ["xhr", ["POST", "/fixture"]],
])("%s preserves local fixture arguments, receiver and return value", (kind, args) => {
  const receiver = {};
  const result = {};
  const delegate = vi.fn(function () { expect(this).toBe(receiver); return result; });
  expect(createUnitNetworkGuard(delegate, kind).apply(receiver, args)).toBe(result);
  expect(delegate).toHaveBeenCalledExactlyOnceWith(...args);
});

test("installs every network boundary before application config is imported with synthetic values", () => {
  expect(importTimeProof).toEqual({
    ready: true, wrapped: true,
    configuration: {
      LANDING_BACKEND_URL: "https://unit-backend.invalid", LANDING_BACKEND_API_KEY: "unit-synthetic-api-key",
      LRS_URL: "https://unit-lrs.invalid", LRS_API_KEY: "unit-synthetic-lrs-key",
      TURNSTILE_SITE_KEY: "unit-synthetic-turnstile", THUMBMARKJS_API_KEY: "unit-synthetic-thumbmark",
      SISTEMA_FRANCES_ON: false, DEV: false, ENABLE_TEST_PERSONAS: false,
    },
  });
});

test("keeps explicit unit env stubs usable without returning to inherited configuration", async () => {
  try {
    vi.stubEnv("VITE_DEV", "true"); vi.resetModules();
    expect((await import("../../config.js")).DEV).toBe(true);
  } finally { vi.unstubAllEnvs(); vi.resetModules(); }
});
