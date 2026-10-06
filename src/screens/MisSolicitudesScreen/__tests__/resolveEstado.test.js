/**
 * Unit tests para resolveEstado (lógica pura — sin renderizar componentes).
 *
 * Cubre los 6 estados del sistema y el bug del trigger de Postgres
 * que setea fecha_estado_gestion con la fecha de ejecución del trigger,
 * no con la fecha real del rechazo.
 */
import { describe, it, expect } from "vitest";
import { resolveEstado, addDays } from "../resolveEstado.js";

/* ── Helpers ──────────────────────────────────────────────────────── */
const dias = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
};

const hace = (n) => dias(-n); // hace N días
const en = (n) => dias(n);   // en N días

const base = {
  estadoOnboarding: null,
  estadoOnboardingFecha: null,
  estadoGestion: null,
  fechaEstadoGestion: null,
  prestamo: null,
};

/* ─────────────────────────────────────────────────────────────────── */

describe("resolveEstado — 6 estados", () => {
  it("ONBOARDING_COMPLETO con idPrestamoDB → Solicitud finalizada", () => {
    const r = resolveEstado({
      ...base,
      estadoOnboarding: "ONBOARDING_COMPLETO",
      prestamo: { idPrestamoDB: "SB-123" },
    });
    expect(r.label).toBe("Solicitud finalizada");
    expect(r.accion).toBeNull();
  });

  it("préstamo SB sin estado de onboarding → Solicitud finalizada", () => {
    const r = resolveEstado({ ...base, prestamo: { idPrestamoDB: "SB-123" } });
    expect(r.label).toBe("Solicitud finalizada");
    expect(r.tipo).toBe("success");
    expect(r.retryDate).toBeNull();
  });

  it("LEAD_CREADO con idPrestamoDB → Solicitud incompleta (onboarding manda)", () => {
    const r = resolveEstado({
      ...base,
      estadoOnboarding: "LEAD_CREADO",
      prestamo: { idPrestamoDB: "SB-123" },
    });
    expect(r.label).toBe("Solicitud incompleta");
    expect(r.accion).toBe("retomar_registro");
  });

  it("RECIBO_SUBIDO con idPrestamoDB → Solicitud incompleta", () => {
    const r = resolveEstado({
      ...base,
      estadoOnboarding: "RECIBO_SUBIDO",
      prestamo: { idPrestamoDB: "SB-123" },
    });
    expect(r.accion).toBe("retomar_registro");
  });

  it("2. gestión ACEPTADO + sim COMPLETADO → Aprobada", () => {
    const r = resolveEstado({
      ...base,
      estadoOnboarding: "ONBOARDING_COMPLETO",
      estadoGestion: "ACEPTADO",
      prestamo: { estado: "COMPLETADO" },
    });
    expect(r.label).toBe("Aprobada");
    expect(r.tipo).toBe("success");
    expect(r.accion).toBeNull();
  });

  it("2b. gestión ACEPTADO no pisa onboarding incompleto", () => {
    const r = resolveEstado({
      ...base,
      estadoOnboarding: "LEAD_CREADO",
      estadoGestion: "ACEPTADO",
    });
    expect(r.label).toBe("Solicitud incompleta");
    expect(r.accion).toBe("retomar_registro");
  });

  it("2c. gestión ACEPTADO + ONBOARDING_COMPLETO (sin sim) → continuar simulación", () => {
    const r = resolveEstado({
      ...base,
      estadoOnboarding: "ONBOARDING_COMPLETO",
      estadoGestion: "ACEPTADO",
    });
    expect(r.accion).toBe("continuar_simulacion");
  });

  it("3. gestión RECHAZADO + onboarding NO RECHAZADO → retryDate desde fechaEstadoGestion", () => {
    // Operador rechazó manualmente — la fecha de gestión es la correcta
    const fechaGestion = hace(10); // rechazado hace 10 días
    const r = resolveEstado({
      ...base,
      estadoGestion: "RECHAZADO",
      estadoOnboarding: "ONBOARDING_COMPLETO",
      fechaEstadoGestion: fechaGestion,
      estadoOnboardingFecha: hace(20), // fecha de onboarding más antigua
    });
    expect(r.label).toBe("No aprobada");
    expect(r.tipo).toBe("danger");
    // retryDate = fechaGestion + 45 días (≈ 35 días en el futuro)
    const expectedRetry = addDays(fechaGestion, 45);
    expect(r.retryDate.toISOString().slice(0, 10)).toBe(expectedRetry.toISOString().slice(0, 10));
  });

  it("3b. gestión RECHAZADO + onboarding también RECHAZADO → retryDate desde estadoOnboardingFecha (bug del trigger)", () => {
    // BUG ESCENARIO: el trigger derivó estado_gestion=RECHAZADO de onboarding=RECHAZADO
    // y seteó fecha_estado_gestion = HOY (fecha del trigger, no del rechazo real).
    // La fecha real del rechazo está en estado_onboarding_fecha.
    const fechaRealRechazo = hace(78);  // rechazo ocurrió hace 78 días
    const fechaTrigger = hace(0);       // trigger corrió hoy (cuando el operador tocó la fila)

    const r = resolveEstado({
      ...base,
      estadoGestion: "RECHAZADO",
      estadoOnboarding: "RECHAZADO",
      fechaEstadoGestion: fechaTrigger,    // ← fecha INCORRECTA del trigger
      estadoOnboardingFecha: fechaRealRechazo, // ← fecha REAL del rechazo
    });

    expect(r.label).toBe("No aprobada");
    // retryDate debe basarse en fechaRealRechazo, NO en fechaTrigger
    // Si usara fechaTrigger: retry = hoy + 45 (dentro de 45 días)
    // Si usa fechaRealRechazo: retry = hace78días + 45 (hace 33 días, ya pasó)
    const expectedRetry = addDays(fechaRealRechazo, 45);
    expect(r.retryDate.toISOString().slice(0, 10)).toBe(expectedRetry.toISOString().slice(0, 10));

    // La fecha de reintento debe estar en el PASADO (ya venció el bloqueo)
    expect(r.retryDate.getTime()).toBeLessThan(Date.now());
  });

  it("3c. gestión RECHAZADO + ambas fechas null → retryDate null", () => {
    const r = resolveEstado({
      ...base,
      estadoGestion: "RECHAZADO",
      estadoOnboarding: "RECHAZADO",
    });
    expect(r.label).toBe("No aprobada");
    expect(r.retryDate).toBeNull();
  });

  it("4. onboarding RECHAZADO (sin gestión) → No aprobada con retryDate desde estadoOnboardingFecha", () => {
    const fechaRechazo = hace(30);
    const r = resolveEstado({
      ...base,
      estadoOnboarding: "RECHAZADO",
      estadoOnboardingFecha: fechaRechazo,
    });
    expect(r.label).toBe("No aprobada");
    const expectedRetry = addDays(fechaRechazo, 45);
    expect(r.retryDate.toISOString().slice(0, 10)).toBe(expectedRetry.toISOString().slice(0, 10));
  });

  it("4b. onboarding RECHAZADO + estadoOnboardingFecha null → fallback a fechaEstadoGestion", () => {
    const fechaGestion = hace(5);
    const r = resolveEstado({
      ...base,
      estadoOnboarding: "RECHAZADO",
      estadoOnboardingFecha: null,
      fechaEstadoGestion: fechaGestion,
    });
    const expectedRetry = addDays(fechaGestion, 45);
    expect(r.retryDate.toISOString().slice(0, 10)).toBe(expectedRetry.toISOString().slice(0, 10));
  });

  it("5a. gestión ANALIZAR + ONBOARDING_COMPLETO → En análisis", () => {
    const r = resolveEstado({
      ...base,
      estadoOnboarding: "ONBOARDING_COMPLETO",
      estadoGestion: "ANALIZAR",
    });
    expect(r.label).toBe("En análisis");
    expect(r.tipo).toBe("warning");
    expect(r.accion).toBeNull();
  });

  it("5a2. gestión ANALIZAR no pisa onboarding incompleto (antes del recibo)", () => {
    const r = resolveEstado({
      ...base,
      estadoOnboarding: "DNI_SUBIDO",
      estadoGestion: "ANALIZAR",
    });
    expect(r.accion).toBe("retomar_registro");
  });

  it("5a3. RECIBO_SUBIDO → retomar (Welcome); no se salta el click de Quiero mi préstamo", () => {
    const r = resolveEstado({
      ...base,
      estadoOnboarding: "RECIBO_SUBIDO",
      estadoGestion: "ANALIZAR",
    });
    expect(r.label).toBe("Solicitud incompleta");
    expect(r.accion).toBe("retomar_registro");
  });

  it("5b. onboarding EN_ANALISIS → En análisis (sin acción)", () => {
    const r = resolveEstado({ ...base, estadoOnboarding: "EN_ANALISIS" });
    expect(r.label).toBe("En análisis");
    expect(r.accion).toBeNull();
  });

  it("5c. onboarding ONBOARDING_COMPLETO → continuar simulación", () => {
    const r = resolveEstado({ ...base, estadoOnboarding: "ONBOARDING_COMPLETO" });
    expect(r.label).toBe("Solicitud incompleta");
    expect(r.accion).toBe("continuar_simulacion");
  });

  it("5d. simulación en Mobbex → continuar simulación", () => {
    const r = resolveEstado({
      ...base,
      estadoOnboarding: "ONBOARDING_COMPLETO",
      prestamo: { estado: "MOBBEX_SUBSCRIPTION" },
    });
    expect(r.accion).toBe("continuar_simulacion");
  });

  it("6. Estado vacío → Solicitud incompleta", () => {
    const r = resolveEstado(base);
    expect(r.label).toBe("Solicitud incompleta");
    expect(r.tipo).toBe("neutral");
    expect(r.retryDate).toBeNull();
  });

  it("6b. LEAD_CREADO → Solicitud incompleta", () => {
    const r = resolveEstado({ ...base, estadoOnboarding: "LEAD_CREADO" });
    expect(r.label).toBe("Solicitud incompleta");
  });

  it("6c. DNI_SUBIDO → Solicitud incompleta", () => {
    const r = resolveEstado({ ...base, estadoOnboarding: "DNI_SUBIDO" });
    expect(r.label).toBe("Solicitud incompleta");
  });

  it("retryDate = 45 días exactos desde la fecha de rechazo", () => {
    const fechaBase = new Date("2026-07-13T00:00:00.000Z").toISOString();
    const r = resolveEstado({
      ...base,
      estadoOnboarding: "RECHAZADO",
      estadoOnboardingFecha: fechaBase,
    });
    // 13 julio + 45 días = 27 agosto
    expect(r.retryDate.toISOString().slice(0, 10)).toBe("2026-08-27");
  });

  it("prestamo sin idPrestamoDB no pisa los otros estados", () => {
    const r = resolveEstado({
      ...base,
      estadoOnboarding: "ONBOARDING_COMPLETO",
      estadoGestion: "ACEPTADO",
      prestamo: { idPrestamoDB: null, estado: "COMPLETADO", capitalSeleccionado: 50000 },
    });
    expect(r.label).toBe("Aprobada");
  });

  it("estado_scoring RECHAZAR solo no activa No aprobada (solo gestión y onboarding importan)", () => {
    const r = resolveEstado({ ...base, estadoScoring: "RECHAZAR" });
    expect(r.label).toBe("Solicitud incompleta"); // no "No aprobada"
  });
});
