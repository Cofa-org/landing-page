import { afterEach, beforeEach, expect, test, vi } from 'vitest';
vi.mock('../../lib/http.js', () => ({ HttpApi: vi.fn() }));
vi.mock('../../lib/utils.js', () => ({ getCookie: vi.fn(), setCookieWithDuration: vi.fn().mockResolvedValue(undefined) }));
import { HttpApi } from '../../lib/http.js';
import { setCookieWithDuration } from '../../lib/utils.js';
import SimuladorService from '../simuladorService.js';

const payload = { scoringId: '123', cuit: '20123456789', shortId: 'abc123def0' };
const session = { token: 'synthetic-jwt', sistemaAmortizacion: 'frances' };
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());
const respond = data => HttpApi.mockResolvedValue({ ok: true, json: async () => data });

test.each(['directo', 'frances'])('writes the session cookie only after confirming system %s', async system => {
  const controller = new AbortController();
  respond({ success: true, data: { ...session, sistemaAmortizacion: system } });
  expect((await SimuladorService.iniciarSesion(payload, { signal: controller.signal })).data.sistemaAmortizacion).toBe(system);
  expect(HttpApi).toHaveBeenCalledWith(expect.stringMatching(/\/api\/simulador-prestamos\/init$/),
    payload, 'POST', expect.anything(), null, controller.signal);
  expect(setCookieWithDuration).toHaveBeenCalledWith('simuladorToken', 'synthetic-jwt', expect.any(Number));
});

test.each([undefined, null, '', 'other'])('never persists a successful response with invalid/missing system %p', async system => {
  respond({ success: true, data: { token: 'synthetic-jwt', ...(system === undefined ? {} : { sistemaAmortizacion: system }) } });
  await expect(SimuladorService.iniciarSesion(payload)).rejects.toThrow();
  expect(setCookieWithDuration).not.toHaveBeenCalled();
});

test('preserves logical phone rejection without creating a cookie', async () => {
  respond({ success: false, cause: 'PHONE_NOT_VALIDATED', data: null });
  expect(await SimuladorService.iniciarSesion(payload)).toMatchObject({ success: false, cause: 'PHONE_NOT_VALIDATED' });
  expect(setCookieWithDuration).not.toHaveBeenCalled();
});

test('a cancelled old initialization cannot overwrite the new session cookie', async () => {
  let release;
  let ready;
  const waiting = new Promise(resolve => { ready = resolve; });
  const json = new Promise(resolve => { release = resolve; });
  HttpApi.mockResolvedValue({ ok: true, json: () => { ready(); return json; } });
  const controller = new AbortController();
  const pending = SimuladorService.iniciarSesion(payload, { signal: controller.signal });
  await waiting;
  controller.abort();
  release({ success: true, data: session });
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  expect(setCookieWithDuration).not.toHaveBeenCalled();
});
