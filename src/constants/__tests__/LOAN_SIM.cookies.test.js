// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import {
  COOKIE_LEAD_TOKEN_CONFIG,
  COOKIE_SIMULADOR_TOKEN_CONFIG,
} from "../LOAN_SIM.js";

// Regression: bug "Date.now() +" frozen at module import.
// The bug produces a value of ~1.79e12 (Date.now() + durationMs).
// A pure duration is at most a few days in ms, i.e. < 1 year in ms (3.15e10).
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

describe("LOAN_SIM cookie configs (regression: Date.now() freeze bug 2026-10-08)", () => {
  it("COOKIE_LEAD_TOKEN_CONFIG.EXPIRY_MS is bounded (not a frozen timestamp)", () => {
    expect(COOKIE_LEAD_TOKEN_CONFIG.EXPIRY_MS).toBeLessThan(ONE_YEAR_MS);
    expect(COOKIE_LEAD_TOKEN_CONFIG.EXPIRY_MS).toBeGreaterThan(0);
  });

  it("COOKIE_LEAD_TOKEN_CONFIG.EXPIRY_MS equals 48h in ms (matches JWT TTL)", () => {
    expect(COOKIE_LEAD_TOKEN_CONFIG.EXPIRY_MS).toBe(48 * 60 * 60 * 1000);
  });

  it("COOKIE_SIMULADOR_TOKEN_CONFIG.EXPIRY_MS is bounded (not a frozen timestamp)", () => {
    expect(COOKIE_SIMULADOR_TOKEN_CONFIG.EXPIRY_MS).toBeLessThan(ONE_YEAR_MS);
    expect(COOKIE_SIMULADOR_TOKEN_CONFIG.EXPIRY_MS).toBeGreaterThan(0);
  });

  it("COOKIE_SIMULADOR_TOKEN_CONFIG.EXPIRY_MS equals 24h in ms (matches simulador JWT TTL)", () => {
    expect(COOKIE_SIMULADOR_TOKEN_CONFIG.EXPIRY_MS).toBe(24 * 60 * 60 * 1000);
  });
});
