// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { LOAN_SIM_STEPS, REJECTION_CONFIG } from "../LOAN_SIM.js";

describe("constantes del gate de validación de CBU (Plan 2026-10-20)", () => {
  it("PENDING_CBU_VALIDATION existe con el string exacto", () => {
    expect(LOAN_SIM_STEPS.PENDING_CBU_VALIDATION).toBe("PENDING_CBU_VALIDATION");
  });

  it("el string del front coincide con el del back (ESTADO_SIMULACION)", () => {
    // El back define ESTADO_SIMULACION.PENDING_CBU_VALIDATION = "PENDING_CBU_VALIDATION".
    // Si difieren, useLoanSimulator hace setStep(LOAN_SIM_STEPS[existingState])
    // → undefined → la pantalla se rompe.
    const backStates = fs.readFileSync(
      path.join(
        __dirname,
        "..",
        "..",
        "..",
        "..",
        "landing-page-backend",
        "core",
        "constants",
        "states.constants.js",
      ),
      "utf8",
    );
    expect(backStates).toContain(
      `PENDING_CBU_VALIDATION: "${LOAN_SIM_STEPS.PENDING_CBU_VALIDATION}"`,
    );
  });

  it("REJECTION_CONFIG.CBU_REJECTED tiene la shape completa", () => {
    const cfg = REJECTION_CONFIG.CBU_REJECTED;
    expect(cfg.cause).toBe("CBU_REJECTED");
    expect(typeof cfg.title).toBe("string");
    expect(typeof cfg.description).toBe("string");
    expect(cfg.illustration).toBeTruthy();
  });

  it("el rechazo de CBU no tiene descripción ni botón (el cliente ya habló con un operador)", () => {
    const cfg = REJECTION_CONFIG.CBU_REJECTED;
    // Sin descripción ni CTA: el cliente ya se comunicó con un operador antes
    // de caer en esta pantalla → pedirle que vuelva a hablar es redundante.
    expect(cfg.description).toBe("");
    expect(cfg.primaryAction).toBeUndefined();
  });

  it('el copy no usa formas de "usted"', () => {
    const text = `${REJECTION_CONFIG.CBU_REJECTED.title} ${REJECTION_CONFIG.CBU_REJECTED.description}`;
    expect(text).not.toMatch(/\busted\b|\bvalida el\b|\bpuedes\b|\bnecesitas\b|\bpuede\b/i);
  });

  it("el copy del rechazo es genérico: no revela la revisión manual ni el motivo", () => {
    const text = `${REJECTION_CONFIG.CBU_REJECTED.title} ${REJECTION_CONFIG.CBU_REJECTED.description}`;
    expect(text).not.toMatch(/asesor revisó|no pudo validar|validar tu cuenta/i);
  });
});
