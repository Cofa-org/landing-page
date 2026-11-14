import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router-dom';
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
