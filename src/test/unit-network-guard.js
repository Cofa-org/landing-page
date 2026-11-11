import http from "node:http";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";
import { syncBuiltinESMExports } from "node:module";

export const UNIT_NETWORK_GUARD_MARKER = Symbol.for("cofa.unit.network-guard");
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const UNIT_ORIGIN = "http://localhost";

function blockedNetworkError() {
  // Never include the requested URL, credentials, headers or body in the error.
  return new Error("UNIT_EXTERNAL_NETWORK_BLOCKED");
}

function authorityHostname(authority) {
  if (typeof authority !== "string" || !authority) throw blockedNetworkError();
  if (LOOPBACK_HOSTS.has(authority.toLowerCase())) return authority.toLowerCase();
  try { return new URL(`http://${authority}`).hostname; }
  catch { throw blockedNetworkError(); }
}

function urlHostname(target, allowRelative) {
  try {
    const address = typeof target === "object" && target?.url ? target.url : target;
    const url = new URL(address, allowRelative ? UNIT_ORIGIN : undefined);
    if (!["http:", "https:"].includes(url.protocol)) throw blockedNetworkError();
    return url.hostname;
  } catch { throw blockedNetworkError(); }
}

function optionsHostname(options) {
  return authorityHostname(options.hostname ?? options.host ?? "localhost");
}

function targetHostnames(kind, args) {
  if (kind === "fetch") return [urlHostname(args[0], true)];
  if (kind === "xhr") return [urlHostname(args[1], true)];
  if (kind === "socket") {
    const target = args[0];
    // Native IPC paths are local, not TCP. Do not interfere with the test runner.
    if (typeof target === "string" || target?.path) return [];
    if (typeof target === "number") return [authorityHostname(typeof args[1] === "string" ? args[1] : "localhost")];
    if (target && typeof target === "object") return [optionsHostname(target)];
    throw blockedNetworkError();
  }
  if (kind === "http") {
    const target = args[0];
    const hosts = typeof target === "string" || target instanceof URL
      ? [urlHostname(target, false)] : [optionsHostname(target ?? {})];
    // http.request(url, options) can override the URL's hostname.
    const overrides = args[1];
    if (overrides && typeof overrides === "object" && (overrides.hostname || overrides.host)) hosts.push(optionsHostname(overrides));
    return hosts;
  }
  throw blockedNetworkError();
}

export function createUnitNetworkGuard(delegate, kind) {
  function guardedUnitNetworkCall(...args) {
    const hosts = targetHostnames(kind, args);
    if (hosts.some(host => !LOOPBACK_HOSTS.has(host.toLowerCase()))) throw blockedNetworkError();
    return delegate.apply(this, args);
  }
  guardedUnitNetworkCall[UNIT_NETWORK_GUARD_MARKER] = true;
  return guardedUnitNetworkCall;
}

function guardMethod(target, method, kind) {
  if (typeof target?.[method] !== "function" || target[method][UNIT_NETWORK_GUARD_MARKER]) return;
  target[method] = createUnitNetworkGuard(target[method], kind);
}

// First ordered setupFile: installed before any application/test-module import.
for (const transport of [http, https]) {
  guardMethod(transport, "request", "http");
  guardMethod(transport, "get", "http");
}
guardMethod(net, "connect", "socket");
guardMethod(net, "createConnection", "socket");
guardMethod(tls, "connect", "socket");
syncBuiltinESMExports();
for (const surface of new Set([globalThis, globalThis.window])) {
  guardMethod(surface, "fetch", "fetch");
  guardMethod(surface?.XMLHttpRequest?.prototype, "open", "xhr");
}
globalThis[UNIT_NETWORK_GUARD_MARKER] = true;
