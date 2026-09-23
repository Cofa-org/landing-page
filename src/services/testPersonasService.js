import { LANDING_BACKEND_URL } from "../config.js";

/**
 * Catálogo de "personas test" expuestas por el backend en /api/test/personas.
 * Sólo se usa en dev / con ?testMode=1. Stub inicial — la implementación
 * completa vive en Task 0.7 del plan 2026-09-17-test-personas-simulador.
 *
 * fetchTestPersonas devuelve el array crudo; fetchTestPersonaById devuelve
 * la persona individual o null si el back responde no-OK / id inválido.
 */

const PERSONAS_PATH = "/api/test/personas";

export async function fetchTestPersonas() {
  try {
    const response = await fetch(`${LANDING_BACKEND_URL}${PERSONAS_PATH}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.personas || [];
  } catch {
    return [];
  }
}

const VALID_ID = /^[A-Z0-9_]+$/;

export async function fetchTestPersonaById(id) {
  if (!id || !VALID_ID.test(String(id).slice(0, 64))) return null;
  try {
    const response = await fetch(
      `${LANDING_BACKEND_URL}${PERSONAS_PATH}/${encodeURIComponent(id)}`,
    );
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Resetea la simulación asociada a una persona del catálogo
 * (caso NORIEGA — testing E2E contra un cliente real sin bypass).
 * Solo aplica para personas con `simuladorConfig.realClient === true`;
 * el backend rechaza con 400 si la persona no es real-client.
 *
 * Devuelve `{ success: true, data: { message, ... } }` o lanza Error si
 * el backend responde non-OK (incluye el `message` del body si existe).
 */
export async function resetTestPersonaSimulation(id) {
  if (!id || !VALID_ID.test(String(id).slice(0, 64))) {
    throw new Error("id inválido");
  }
  const response = await fetch(
    `${LANDING_BACKEND_URL}${PERSONAS_PATH}/${encodeURIComponent(id)}/reset-simulacion`,
    { method: "POST" },
  );
  if (!response.ok) {
    let body = {};
    try {
      body = await response.json();
    } catch {
      // body no es JSON
    }
    const message = body?.message || body?.error || `reset failed (HTTP ${response.status})`;
    throw new Error(message);
  }
  return response.json();
}