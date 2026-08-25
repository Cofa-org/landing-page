/**
 * Utilidades para interactuar con el Webchat Nativo de Callbell
 * Dado que el nuevo script no expone window.callbell('open'),
 * estas funciones manipulan el DOM directamente.
 */

// Alterna la visibilidad del div host del widget para ocultarlo/mostrarlo
export const toggleCallbellWidget = (isVisible) => {
  const widgetHost = document.getElementById('callbell-livechat-host');
  if (widgetHost) {
    widgetHost.style.display = isVisible ? 'block' : 'none';
  }
};

// Intenta simular un clic en el botón de apertura del chat nativo
export const openCallbellWidget = () => {
  const widgetHost = document.getElementById('callbell-livechat-host');
  if (widgetHost) {
    // Callbell inyecta un iframe o botones dentro del div host
    // Buscamos cualquier elemento clickeable dentro del contenedor principal
    // (A veces el botón se esconde tras un Shadow DOM, en ese caso la redirección a WA será la alternativa)
    try {
      const launcherBtn = widgetHost.querySelector('[role="button"]') || widgetHost.querySelector('button');
      if (launcherBtn) {
        launcherBtn.click();
      } else {
        // Fallback si no encontramos el botón
        console.warn('Callbell Livechat launcher button not found.');
      }
    } catch (e) {
      console.error('Error attempting to open Callbell Livechat programmatically:', e);
    }
  }
};
