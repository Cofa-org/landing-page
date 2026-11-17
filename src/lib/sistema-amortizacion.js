import { SISTEMA_AMORTIZACION } from '../constants/sistema-amortizacion.constants.js';
export const esSistemaAmortizacionValido = system => system === SISTEMA_AMORTIZACION.DIRECTO || system === SISTEMA_AMORTIZACION.FRANCES;

export function validarSesionSimulador(session) {
  if (typeof session?.token !== 'string' || !session.token || !esSistemaAmortizacionValido(session.sistemaAmortizacion)) {
    throw new Error('No se pudo iniciar la sesión del simulador. Volvé a abrir el link.');
  }
  return session;
}
