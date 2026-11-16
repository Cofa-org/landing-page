// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
vi.mock('../../../../../config.js', () => ({ isTestPersonasVisible: () => true, DEV: true }));
import TestSimuladorPanel from '../TestSimuladorPanel.jsx';
const personas = [{ id: 'SIM_NORIEGA_REAL', label: 'Noriega', sistemasAmortizacion: ['directo','frances'] }, { id: 'SIM_HAPPY', label: 'Happy' }];
afterEach(cleanup);

test('offers only one system selector and sends the chosen mode with Noriega', () => {
  const select = vi.fn();
  render(<TestSimuladorPanel personas={personas} onSelectPersona={select} />);
  const dropdown = screen.getByRole('combobox', { name: /sistema.*Noriega/i });
  expect(dropdown.value).toBe('directo');
  fireEvent.change(dropdown, { target: { value: 'frances' } });
  fireEvent.click(screen.getByRole('button', { name: /Noriega.*Iniciar prueba/i }));
  expect(select).toHaveBeenCalledWith('SIM_NORIEGA_REAL', 'frances');
  fireEvent.click(screen.getByRole('button', { name: /Happy/i }));
  expect(select).toHaveBeenLastCalledWith('SIM_HAPPY');
  expect(screen.getAllByRole('combobox')).toHaveLength(1);
});

test('blocks controls during preparation and displays preparation errors', () => {
  const props = { personas, onSelectPersona: vi.fn(), onReset: vi.fn() };
  const { rerender } = render(<TestSimuladorPanel {...props} startingPersona='SIM_NORIEGA_REAL' />);
  expect(screen.getByRole('combobox').disabled).toBe(true);
  expect(screen.getAllByRole('button').every(button => button.disabled)).toBe(true);
  expect(screen.getByRole('button', { name: /Noriega.*Iniciar prueba/i })).toHaveAttribute('aria-busy', 'true');
  rerender(<TestSimuladorPanel {...props} error='No se pudo preparar Noriega' />);
  expect(screen.getByRole('alert').textContent).toContain('No se pudo preparar');
  expect(screen.getByRole('combobox').disabled).toBe(false);
});

test('starts with the confirmed French system and distinguishes the next choice from the active one', () => {
  const select = vi.fn();
  render(<TestSimuladorPanel personas={personas} sistemaActual='frances' onSelectPersona={select} />);
  expect(screen.getByRole('status').textContent).toContain('Sistema actual: Francés');
  const dropdown = screen.getByRole('combobox');
  expect(dropdown.value).toBe('frances');
  expect(screen.getByRole('button', { name: /Noriega.*Iniciar prueba en Francés/i })).toBeTruthy();
  fireEvent.change(dropdown, { target: { value: 'directo' } });
  expect(screen.getByRole('status').textContent).toContain('Sistema actual: Francés');
  fireEvent.click(screen.getByRole('button', { name: /Noriega.*Iniciar prueba en Directo/i }));
  expect(select).toHaveBeenCalledWith('SIM_NORIEGA_REAL', 'directo');
});

test('does not show a temporary direct choice while the system is being confirmed', () => {
  const props = { personas, onSelectPersona: vi.fn() };
  const { rerender } = render(<TestSimuladorPanel {...props} consultandoSistema />);
  expect(screen.getByRole('status').textContent).toContain('Consultando sistema');
  expect(screen.getByRole('combobox').value).toBe('');
  expect(screen.getByRole('combobox').disabled).toBe(true);
  rerender(<TestSimuladorPanel {...props} sistemaActual='frances' consultandoSistema={false} />);
  expect(screen.getByRole('combobox').value).toBe('frances');
  expect(screen.getByRole('combobox').disabled).toBe(false);
});

test('does not present a default or invalid value as a confirmed active system', () => {
  render(<TestSimuladorPanel personas={personas} sistemaActual='unknown' onSelectPersona={vi.fn()} />);
  expect(screen.getByRole('status').textContent).toContain('Sin simulación activa');
  expect(screen.queryByText(/Sistema actual:/)).toBeNull();
});
