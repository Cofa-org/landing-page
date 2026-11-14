import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router-dom';
vi.mock('../../../../services/linkResolutionService.js', () => ({ default: { consumeLink: vi.fn() } }));
vi.mock('../../../../services/simuladorService.js', () => ({ default: {
  iniciarSesion: vi.fn(), calcularPlanes: vi.fn(), obtenerInfoPrestamo: vi.fn(), guardarPlan: vi.fn(),
} }));
vi.mock('../../../../lib/fingerprint.js', () => ({ getFingerprint: vi.fn(), mapFingerprintToHuellaData: vi.fn() }));
vi.mock('../../../../lib/utils.js', () => ({ getCookie: vi.fn(), deleteCookie: vi.fn().mockResolvedValue(undefined),
  setCookieWithDuration: vi.fn().mockResolvedValue(undefined), roundToFiveHundreds: value => Math.round(value / 500) * 500 }));
import LinkResolutionService from '../../../../services/linkResolutionService.js';
import SimuladorService from '../../../../services/simuladorService.js';
import { getFingerprint, mapFingerprintToHuellaData } from '../../../../lib/fingerprint.js';
import { getCookie, setCookieWithDuration } from '../../../../lib/utils.js';
import { useLoanSimulator } from '../useLoanSimulator.js';

const link = scoring => ({ success: true, data: { scoringId: scoring, cuit: '20123456789' } });
const system = scoring => scoring === '124' ? 'directo' : 'frances';
const session = scoring => ({ success: true, data: { token: `synthetic-${scoring}`, sistemaAmortizacion: system(scoring) } });
const calculated = scoring => ({ success: true, data: { sistemaAmortizacion: system(scoring), capital_maximo_a_ofrecer: 0,
  planes_disponibles: [{ plazo: 6, valorCuota: 2000, tasaOp: 0.5 }] } });
function renderSimulator(url = '/?id=first') {
  return renderHook(() => ({ loan: useLoanSimulator(), navigate: useNavigate() }), {
    wrapper: ({ children }) => <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>,
  });
}
function deferred() {
  let resolve;
  const promise = new Promise(release => { resolve = release; });
  return { promise, resolve };
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  sessionStorage.clear();
  getCookie.mockResolvedValue(null);
  LinkResolutionService.consumeLink.mockImplementation(async id => link(id === 'second' ? '124' : '123'));
  getFingerprint.mockResolvedValue({ visitorId: 'synthetic' });
  mapFingerprintToHuellaData.mockReturnValue({ visitor_id: 'synthetic' });
  SimuladorService.iniciarSesion.mockImplementation(async ({ scoringId }) => session(scoringId));
  SimuladorService.calcularPlanes.mockImplementation(async ({ scoringId }) => calculated(scoringId));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test.each([undefined, null, 'other'])('initialization without confirmed system %p cannot start calculation', async mode => {
  SimuladorService.iniciarSesion.mockResolvedValue({ success: true, data: { token: 'synthetic', sistemaAmortizacion: mode } });
  const { result } = renderSimulator();
  await waitFor(() => expect(result.current.loan.initialSimulationResolved).toBe(true));
  expect(SimuladorService.calcularPlanes).not.toHaveBeenCalled();
  expect(result.current.loan.simulationData).toBeNull();
  expect(result.current.loan.error).toBeTruthy();
});

test('a calculator response for another system cannot populate financial UI', async () => {
  SimuladorService.calcularPlanes.mockResolvedValue(calculated('124'));
  const { result } = renderSimulator();
  await waitFor(() => expect(result.current.loan.initialSimulationResolved).toBe(true));
  expect(result.current.loan.simulationData).toBeNull();
  expect(result.current.loan.error).toBeTruthy();
});

test('a stale consumed link cannot mint a session or overwrite the new scoring', async () => {
  const old = deferred();
  LinkResolutionService.consumeLink.mockImplementation(id => id === 'first' ? old.promise : Promise.resolve(link('124')));
  const { result } = renderSimulator();
  await act(async () => result.current.navigate('/?id=second'));
  await waitFor(() => expect(result.current.loan.simulationData?.sistemaAmortizacion).toBe('directo'));
  await act(async () => old.resolve(link('123')));
  expect(result.current.loan.scoringId).toBe('124');
  expect(SimuladorService.iniciarSesion.mock.calls.map(([args]) => args.scoringId)).toEqual(['124']);
});

test('a late old initialization is aborted and cannot replace new session state', async () => {
  const old = deferred();
  SimuladorService.iniciarSesion.mockImplementation(({ scoringId }) => scoringId === '123' ? old.promise : Promise.resolve(session('124')));
  const { result } = renderSimulator();
  await waitFor(() => expect(SimuladorService.iniciarSesion).toHaveBeenCalledTimes(1));
  await act(async () => result.current.navigate('/?id=second'));
  await waitFor(() => expect(result.current.loan.simulationData?.sistemaAmortizacion).toBe('directo'));
  await act(async () => old.resolve(session('123')));
  expect(result.current.loan.scoringId).toBe('124');
  expect(SimuladorService.iniciarSesion.mock.calls[0][1]?.signal?.aborted).toBe(true);
});

test('changing link aborts an old calculation before the new link has resolved', async () => {
  const oldCalculation = deferred();
  const newLink = deferred();
  SimuladorService.calcularPlanes.mockImplementation(({ scoringId }) => scoringId === '123' ? oldCalculation.promise : Promise.resolve(calculated('124')));
  LinkResolutionService.consumeLink.mockImplementation(id => id === 'second' ? newLink.promise : Promise.resolve(link('123')));
  const { result } = renderSimulator();
  await waitFor(() => expect(SimuladorService.calcularPlanes).toHaveBeenCalledTimes(1));
  const oldSignal = SimuladorService.calcularPlanes.mock.calls[0][1];
  await act(async () => result.current.navigate('/?id=second'));
  await act(async () => oldCalculation.resolve(calculated('123')));
  expect(oldSignal.aborted).toBe(true);
  expect(result.current.loan.simulationData).toBeNull();
  expect(result.current.loan.initialSimulationResolved).toBe(false);
  await act(async () => newLink.resolve(link('124')));
  await waitFor(() => expect(result.current.loan.scoringId).toBe('124'));
});

test('a legacy information cookie refreshes system without renewing its access window', async () => {
  getCookie.mockResolvedValue(JSON.stringify({ scoringId: '123', CFTA: 'stale' }));
  SimuladorService.obtenerInfoPrestamo.mockResolvedValue({ success: true, data: { sistemaAmortizacion: 'frances', CFTA: '210.00%' } });
  const { result } = renderSimulator('/');
  let allowed;
  await act(async () => { allowed = await result.current.loan.handleInfoPrestamo(); });
  expect(allowed).toBe(true);
  expect(result.current.loan.loanInfo).toMatchObject({ sistemaAmortizacion: 'frances', CFTA: '210.00%' });
  expect(SimuladorService.obtenerInfoPrestamo).toHaveBeenCalledWith('123');
  expect(setCookieWithDuration).not.toHaveBeenCalled();
});

test('missing information cookie cannot regain access through a backend fallback', async () => {
  const { result } = renderSimulator('/');
  let allowed;
  await act(async () => { allowed = await result.current.loan.handleInfoPrestamo(); });
  expect(allowed).toBe(false);
  expect(SimuladorService.obtenerInfoPrestamo).not.toHaveBeenCalled();
});

test('an active loan cannot display information cached for a different scoring', async () => {
  getCookie.mockResolvedValue(JSON.stringify({ scoringId: '123', sistemaAmortizacion: 'directo', CFTA: '125.00%' }));
  const { result } = renderSimulator('/?id=second');
  await waitFor(() => expect(result.current.loan.scoringId).toBe('124'));
  let allowed;
  await act(async () => { allowed = await result.current.loan.handleInfoPrestamo(); });
  expect(allowed).toBe(false);
  expect(SimuladorService.obtenerInfoPrestamo).not.toHaveBeenCalled();
});
