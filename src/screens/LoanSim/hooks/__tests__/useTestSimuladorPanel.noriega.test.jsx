// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
const flags = vi.hoisted(() => ({ dev: true }));
vi.mock('../../../../config.js', () => ({ get DEV() { return flags.dev; }, isTestPersonasVisible: () => true }));
vi.mock('../../../../services/testPersonasService.js', () => ({ fetchTestPersonas: vi.fn(), fetchTestPersonaById: vi.fn(), resetTestPersonaSimulation: vi.fn(), aprobarCbuTestPersona: vi.fn() }));
import { fetchTestPersonas, fetchTestPersonaById, resetTestPersonaSimulation } from '../../../../services/testPersonasService.js';
import { useTestSimuladorPanel } from '../useTestSimuladorPanel.js';
const persona = { id: 'SIM_NORIEGA_REAL', useCases: ['simulador'], sistemasAmortizacion: ['directo', 'frances'],
  simuladorConfig: { realClient: true, scoringId: 43145, shortId: 'abc123def0' } };
const confirmation = mode => ({ success: true, data: { shortId: 'abc123def0', sistemaAmortizacion: mode } });
const originalLocation = window.location;
const wrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>;
beforeEach(() => {
  vi.resetAllMocks(); flags.dev = true; sessionStorage.clear();
  fetchTestPersonas.mockResolvedValue([persona]); fetchTestPersonaById.mockResolvedValue(persona);
  delete window.location; window.location = { href: '', search: '' };
});
afterEach(() => { cleanup(); delete window.location; window.location = originalLocation; });

test.each(['directo','frances'])('waits for the confirmed reset before navigating with the same link: %s', async mode => {
  let release;
  resetTestPersonaSimulation.mockReturnValue(new Promise(resolve => { release = resolve; }));
  const { result } = renderHook(() => useTestSimuladorPanel(), { wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));
  sessionStorage.setItem('simuladorTestPersona', 'old');
  let operation;
  await act(async () => { operation = result.current.selectPersona(persona.id, mode); await Promise.resolve(); });
  expect(result.current.startingPersona).toBe(persona.id);
  expect(window.location.href).toBe('');
  expect(resetTestPersonaSimulation).toHaveBeenCalledWith(persona.id, { sistemaAmortizacion: mode });
  await act(async () => { await result.current.selectPersona(persona.id, mode); });
  expect(resetTestPersonaSimulation).toHaveBeenCalledTimes(1);
  await act(async () => { release(confirmation(mode)); await operation; });
  expect(window.location.href).toBe('/simulador?id=abc123def0');
  expect(sessionStorage.getItem('simuladorTestPersona')).toBeNull();
});

test.each([
  { success: false, message: 'fallo de preparacion' },
  confirmation('directo'),
  { success: true, data: { sistemaAmortizacion: 'frances', shortId: 'foreign' } },
])('does not navigate on a failed or inconsistent preparation: %p', async response => {
  resetTestPersonaSimulation.mockResolvedValue(response);
  const { result } = renderHook(() => useTestSimuladorPanel(), { wrapper });
  await act(async () => { await result.current.selectPersona(persona.id, 'frances'); });
  expect(window.location.href).toBe('');
  expect(result.current.error).toBeTruthy();
  expect(result.current.startingPersona).toBeNull();
});

test('shows a recoverable request error and allows retry', async () => {
  resetTestPersonaSimulation.mockRejectedValueOnce(new Error('connection reset')).mockResolvedValue(confirmation('frances'));
  const { result } = renderHook(() => useTestSimuladorPanel(), { wrapper });
  await act(async () => { await result.current.selectPersona(persona.id, 'frances'); });
  expect(window.location.href).toBe(''); expect(result.current.error).toContain('connection reset');
  await act(async () => { await result.current.selectPersona(persona.id, 'frances'); });
  expect(window.location.href).toBe('/simulador?id=abc123def0');
});

test('does not prepare or navigate in a non-dev build', async () => {
  flags.dev = false;
  const { result } = renderHook(() => useTestSimuladorPanel(), { wrapper });
  await act(async () => { await result.current.selectPersona(persona.id, 'frances'); });
  expect(resetTestPersonaSimulation).not.toHaveBeenCalled(); expect(window.location.href).toBe('');
});

test('reports a failed persona lookup instead of silently ignoring the selection', async () => {
  fetchTestPersonaById.mockResolvedValue(null);
  const { result } = renderHook(() => useTestSimuladorPanel(), { wrapper });
  await act(async () => { await result.current.selectPersona(persona.id, 'frances'); });
  expect(result.current.error).toBeTruthy();
  expect(resetTestPersonaSimulation).not.toHaveBeenCalled();
  expect(window.location.href).toBe('');
});

test('ignores a pending completion after leaving the panel', async () => {
  let release;
  resetTestPersonaSimulation.mockReturnValue(new Promise(resolve => { release = resolve; }));
  const { result, unmount } = renderHook(() => useTestSimuladorPanel(), { wrapper });
  let operation;
  await act(async () => { operation = result.current.selectPersona(persona.id, 'frances'); await Promise.resolve(); });
  unmount();
  await act(async () => { release(confirmation('frances')); await operation; });
  expect(window.location.href).toBe('');
});

test('keeps the reset locked after confirmation while the full reload is still pending', async () => {
  resetTestPersonaSimulation.mockResolvedValue(confirmation('directo'));
  const { result } = renderHook(() => useTestSimuladorPanel(), { wrapper });
  await act(async () => { await result.current.selectPersona(persona.id, 'directo'); });
  expect(window.location.href).toBe('/simulador?id=abc123def0');
  // location is stubbed: the old document remains alive until the next navigation completes.
  await act(async () => { await result.current.selectPersona(persona.id, 'frances'); });
  expect(resetTestPersonaSimulation).toHaveBeenCalledTimes(1);
  expect(result.current.startingPersona).toBe(persona.id);
});
