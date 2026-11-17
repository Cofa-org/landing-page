import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router-dom';
vi.mock('../../../config.js', async importOriginal => ({ ...(await importOriginal()), DEV: true, isTestPersonasVisible: () => true }));
vi.mock('../../../services/testPersonasService.js', () => ({
  fetchTestPersonas: vi.fn(async () => [{ id: 'SIM_NORIEGA_REAL', label: 'Noriega', useCases: ['simulador'], sistemasAmortizacion: ['directo','frances'] }]),
  fetchTestPersonaById: vi.fn(), resetTestPersonaSimulation: vi.fn(), aprobarCbuTestPersona: vi.fn(),
}));
vi.mock('../../../services/linkResolutionService.js', () => ({ default: { consumeLink: vi.fn(async id => ({
  success: true, data: { scoringId: id === 'second' ? '124' : '123', cuit: '20123456789' },
})) } }));
vi.mock('../../../services/simuladorService.js', () => ({ default: {
  iniciarSesion: vi.fn(async ({ scoringId }) => ({ success: true, data: { token: 'synthetic', sistemaAmortizacion: scoringId === '123' ? 'frances' : 'directo' } })),
  calcularPlanes: vi.fn(async ({ scoringId }) => {
    const capital = scoringId === '123' ? 100000 : 200000;
    return { success: true, data: { sistemaAmortizacion: scoringId === '123' ? 'frances' : 'directo', capital_utilizado: capital,
      capital_maximo_a_ofrecer: capital, tasa_nominal: 1.25, tasas: { tna: 1.15, cftna: 2.1 },
      planes_disponibles: [{ plazo: 12, valorCuota: capital / 10, totalOp: capital * 1.2, tasaOp: 0.625, tasas: { cftno: 1.05 } }],
    } };
  }),
  verificarComplianceExistente: vi.fn(async () => ({ success: true, exists: false })),
} }));
vi.mock('../../../lib/fingerprint.js', () => ({ getFingerprint: vi.fn(async () => ({})), mapFingerprintToHuellaData: vi.fn(() => null) }));
vi.mock('../../../Components/index.js', async importOriginal => ({ ...(await importOriginal()), Header: () => null, Footer: () => null }));
vi.mock('../../../Sections/index.js', async importOriginal => ({ ...(await importOriginal()), HeroLoanSim: () => null }));
import SimuladorService from '../../../services/simuladorService.js';
import LoanSimScreen from '../LoanSimScreen.jsx';
afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

test('a new link cannot reuse the capital debounced for the previous loan', async () => {
  const { result } = renderHook(() => useNavigate(), { wrapper: ({ children }) =>
    <MemoryRouter initialEntries={['/?id=first']}><LoanSimScreen />{children}</MemoryRouter> });
  await waitFor(() => expect(SimuladorService.calcularPlanes.mock.calls.some(([args]) =>
    args.scoringId === '123' && args.capitalSeleccionado === 100000)).toBe(true), { timeout: 3000 });
  await act(async () => result.current('/?id=second'));
  await waitFor(() => expect(SimuladorService.calcularPlanes.mock.calls.some(([args]) => args.scoringId === '124')).toBe(true));
  expect(SimuladorService.calcularPlanes.mock.calls.filter(([args]) =>
    args.scoringId === '124' && args.capitalSeleccionado === 100000)).toEqual([]);
}, 10000);

test.each([
  ['first', 'frances', 'Francés', 'directo', 'Directo'],
  ['second', 'directo', 'Directo', 'frances', 'Francés'],
])('a reload restores confirmed system %s rather than the previous draft choice', async (id, system, label, nextSystem, nextLabel) => {
  const open = () => render(<MemoryRouter initialEntries={[`/?id=${id}`]}><LoanSimScreen /></MemoryRouter>);
  const page = open();
  await screen.findByText(`Sistema actual: ${label}`);
  expect(screen.getByRole('combobox').value).toBe(system);
  fireEvent.change(screen.getByRole('combobox'), { target: { value: nextSystem } });
  expect(screen.getByRole('button', { name: new RegExp(`Noriega.*Iniciar prueba en ${nextLabel}`, 'i') })).toBeTruthy();
  expect(screen.getByText(`Sistema actual: ${label}`)).toBeTruthy();
  page.unmount();
  open();
  await screen.findByText(`Sistema actual: ${label}`);
  expect(screen.getByRole('combobox').value).toBe(system);
}, 10000);
