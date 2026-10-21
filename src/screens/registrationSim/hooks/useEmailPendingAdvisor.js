import { useCallback } from "react";
import { toggleCallbellWebchat, openCallbellWebchat } from "../../../utils/callbellHelpers";

/**
 * Plan 2026-10-09: hook para el step `EMAIL_PENDING_ADVISOR`. Encapsula la
 * única side-effect (abrir el chat de Callbell) cuando el cliente hace
 * click en "Comunicarse con un asesor". Sigue la convención
 * `manual-validation-tags-2026-08-06`: lógica en hooks, components puros.
 *
 * `handleContactAdvisor` se memoiza con `useCallback([])` para que la
 * referencia sea estable entre renders — el componente
 * `EmailPendingAdvisorStep` está envuelto en `memo`, y entregarle una
 * función nueva en cada render rompería esa optimización (regla
 * `rerender-memo` / `rerender-functional-setstate`).
 *
 * Fix e2e 2026-10-15: el hook debe ABRIR el chat directamente, no solo
 * mostrar el botón flotante. `toggleCallbellWebchat(true)` solo manipula
 * la clase `hide-callbell` del body (visibilidad del widget). La apertura
 * real del panel de chat se hace vía `openCallbellWebchat()` (que simula
 * un click en el botón launcher del widget de Callbell inyectado por el
 * script en `index.html`). Llamamos a `toggleCallbellWebchat(true)`
 * primero como defensa por si el effect del `OnboardingFlowScreen`
 * hubiera ocultado el widget — un no-op si ya está visible.
 *
 * @returns {{ handleContactAdvisor: () => void }}
 */
export const useEmailPendingAdvisor = () => {
  const handleContactAdvisor = useCallback(() => {
    // toggleCallbellWebchat(true);
    openCallbellWebchat();
  }, []);

  return { handleContactAdvisor };
};