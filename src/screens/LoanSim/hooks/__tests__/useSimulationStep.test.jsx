import { expect, test, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
const { buildFlag } = vi.hoisted(() => ({ buildFlag: { value: false } }));
vi.mock('../../../../config.js', () => ({ get SISTEMA_FRANCES_ON() { return buildFlag.value; } }));
import { useSimulationStep } from '../useSimulationStep.js';

const plans = Object.freeze([{ plazo: 6, valorCuota: 2000, tasaOp: 0.625, tasas: { cftno: 1.05 } }]);
const data = system => ({ sistemaAmortizacion: system, tasa_nominal: 1.25,
  tasas: { tna: 1.15, cftna: 2.1 }, planes_disponibles: plans });

test.each([
  ['directo', true, { cfta: '125.00', cfto: '62.50', tna: '98.75', esSistemaFrances: false }],
  ['frances', false, { cfta: '210.00', cfto: '105.00', tna: '115.00', esSistemaFrances: true }],
])('rates follow backend system %s despite a contradictory build flag', (system, flag, expected) => {
  buildFlag.value = flag;
  const { result } = renderHook(() => useSimulationStep({ simulationData: data(system), installment: 6 }));
  expect(result.current).toMatchObject(expected);
});

test('updates rates when only the system changes, without reloading modules', () => {
  const { result, rerender } = renderHook(({ system }) => useSimulationStep({ simulationData: data(system), installment: 6 }),
    { initialProps: { system: 'directo' } });
  expect(result.current.cfta).toBe('125.00');
  rerender({ system: 'frances' });
  expect(result.current).toMatchObject({ cfta: '210.00', cfto: '105.00', tna: '115.00' });
});

test('supports the initial loading render without a plan', () => {
  const { result } = renderHook(() => useSimulationStep({ simulationData: null, installment: null }));
  expect(result.current).toMatchObject({ installments: [], selectedPlan: null, maxPlazo: 0 });
});
