// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { LOAN_SIM_STEPS, REJECTION_CONFIG } from "../LOAN_SIM.js";

// Test de contrato con el repo hermano: lee `states.constants.js` del back
// para confirmar que el string del estado coincide en los dos lados.
//
// El front y el back son repos SEPARADOS: el back no es parte de este repo y
// no puede estar disponible en un clon limpio ni en CI (que checkoutea un solo
// repo). Por eso NO se busca el hermano por un path relativo hardcodeado
// (dependía del layout local `PROYECTOS/LANDING PAGE/` y del repo hermano
// justo en la rama correcta): el path se pasa por env var y, si no está
// definido o el repo no existe, el test se skipea.
//
// Con el repo disponible:
//   BACKEND_REPO_PATH=../landing-page-backend npm test
// Sin él: el test queda skipped (visible en el reporte), nunca rojo.
const BACKEND_STATES_PATH = process.env.BACKEND_REPO_PATH
  ? path.join(
      process.env.BACKEND_REPO_PATH,
      "core",
      "constants",
      "states.constants.js",
    )
  : null;
const backStatesAvailable = Boolean(
  BACKEND_STATES_PATH && fs.existsSync(BACKEND_STATES_PATH),
);

describe("constantes del gate de validación de CBU (Plan 2026-10-20)", () => {
  it("PENDING_CBU_VALIDATION existe con el string exacto", () => {
    expect(LOAN_SIM_STEPS.PENDING_CBU_VALIDATION).toBe("PENDING_CBU_VALIDATION");
  });

  it.skipIf(!backStatesAvailable)(
    "el string del front coincide con el del back (ESTADO_SIMULACION)",
    () => {
      // El back define ESTADO_SIMULACION.PENDING_CBU_VALIDATION = "PENDING_CBU_VALIDATION".
      // Si difieren, useLoanSimulator hace setStep(LOAN_SIM_STEPS[existingState])
      // → undefined → la pantalla se rompe.
      const backStates = fs.readFileSync(BACKEND_STATES_PATH, "utf8");
      expect(backStates).toContain(
        `PENDING_CBU_VALIDATION: "${LOAN_SIM_STEPS.PENDING_CBU_VALIDATION}"`,
      );
    },
  );

  it("REJECTION_CONFIG.CBU_REJECTED tiene la shape completa", () => {
    const cfg = REJECTION_CONFIG.CBU_REJECTED;
    expect(cfg.cause).toBe("CBU_REJECTED");
    expect(typeof cfg.title).toBe("string");
    expect(typeof cfg.description).toBe("string");
    expect(cfg.illustration).toBeTruthy();
  });

  it("el rechazo de CBU no tiene botón y su descripción es genérica (el cliente ya habló con un operador)", () => {
    const cfg = REJECTION_CONFIG.CBU_REJECTED;
    // Sin CTA: el cliente ya se comunicó con un operador antes de caer en esta
    // pantalla → pedirle que vuelva a hablar es redundante.
    expect(cfg.primaryAction).toBeUndefined();
    // La descripción sí existe, pero es genérica: no pide hablar con un
    // operador otra vez ni revela que hubo una revisión manual.
    expect(cfg.description).toBe(
      "Te invitamos a intentarlo nuevamente más adelante. Gracias por tu comprensión",
    );
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
