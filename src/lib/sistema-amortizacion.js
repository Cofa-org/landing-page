export const esSistemaAmortizacionValido = system => system === 'directo' || system === 'frances';

export function validarSesionSimulador(session) {
  if (typeof session?.token !== 'string' || !session.token || !esSistemaAmortizacionValido(session.sistemaAmortizacion)) {
    throw new Error('No se pudo iniciar la sesión del simulador. Volvé a abrir el link.');
  }
  return session;
}
