import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
vi.mock('../../../../../hooks/usePDFExport.js', () => ({ usePDFExport: vi.fn(() => ({ generatePDF: vi.fn() })) }));
import { usePDFExport } from '../../../../../hooks/usePDFExport.js';
import LoanInfoModal from '../LoanInfoModal.jsx';
const loanInfo = { FechaDeSolicitud: '2026-11-14', CapitalDelPrestamo: '$100000', TotalDeIntereses: '$20000',
  CantidadDeCuotas: 12, MontoCuota: '$10000', CFTO: '105.00%', TNA: '115.00%', CFTA: '210.00%' };
afterEach(() => { cleanup(); vi.clearAllMocks(); });

test.each([['directo','CFTA:','CFTO:'],['frances','CFTNA:','CFTNO:']])('modal and PDF use the loan system %s', (system, annual, period) => {
  render(<LoanInfoModal loanInfo={{ ...loanInfo, sistemaAmortizacion: system }} closeModal={() => {}} simulationData={null} />);
  expect(screen.getByText(annual)).toBeTruthy();
  expect(screen.getByText(period)).toBeTruthy();
  expect(screen.getByText('TNA:')).toBeTruthy();
  const labels = usePDFExport.mock.calls.at(-1)[0].fields.map(field => field.label);
  expect(labels).toContain(annual.slice(0,-1));
  expect(labels).toContain(period.slice(0,-1));
  expect(labels).not.toContain(system === 'frances' ? 'CFTA' : 'CFTNA');
});

test('changes labels between loans in one module load', () => {
  const { rerender } = render(<LoanInfoModal loanInfo={{ ...loanInfo, sistemaAmortizacion: 'directo' }} closeModal={() => {}} />);
  expect(screen.getByText('CFTA:')).toBeTruthy();
  rerender(<LoanInfoModal loanInfo={{ ...loanInfo, sistemaAmortizacion: 'frances' }} closeModal={() => {}} />);
  expect(screen.getByText('CFTNA:')).toBeTruthy();
  expect(screen.queryByText('CFTA:')).toBeNull();
});

test('loading without loan info does not render financial labels or crash', () => {
  const { container } = render(<LoanInfoModal loanInfo={null} closeModal={() => {}} />);
  expect(container.textContent).toBe('');
});
