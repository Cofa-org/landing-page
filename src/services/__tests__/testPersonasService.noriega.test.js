// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { resetTestPersonaSimulation } from '../testPersonasService.js';
beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
afterEach(() => vi.unstubAllGlobals());

test.each(['directo', 'frances'])('sends only the selected system to prepare Noriega: %s', async sistemaAmortizacion => {
  const body = { success: true, data: { sistemaAmortizacion, shortId: 'abc123def0' } };
  fetch.mockResolvedValue({ ok: true, json: async () => body });
  expect(await resetTestPersonaSimulation('SIM_NORIEGA_REAL', { sistemaAmortizacion })).toEqual(body);
  const [url, options] = fetch.mock.calls[0];
  expect(url).toContain('/SIM_NORIEGA_REAL/reset-simulacion');
  expect(options.method).toBe('POST');
  expect(JSON.parse(options.body)).toEqual({ sistemaAmortizacion });
  expect(options.headers['Content-Type']).toBe('application/json');
});

test('keeps the legacy reset request without a system body', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
  await resetTestPersonaSimulation('SIM_CBU_PENDING');
  expect(fetch.mock.calls[0][1]).toEqual({ method: 'POST' });
});

test('rejects a logical reset failure even when HTTP is 200', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => ({ success: false, message: 'No se preparo la prueba' }) });
  await expect(resetTestPersonaSimulation('SIM_NORIEGA_REAL', { sistemaAmortizacion: 'frances' })).rejects.toThrow('No se preparo');
});
