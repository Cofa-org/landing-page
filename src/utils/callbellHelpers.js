/**
 * Utilidades para interactuar con el Webchat Nativo de Callbell
 * Dado que el nuevo script no expone window.callbell('open'),
 * estas funciones manipulan el DOM directamente.
 */

// Alterna la visibilidad agregando o quitando una clase en el body
export const toggleCallbellWebchat = (isVisible) => {
  if (isVisible) {
    document.body.classList.remove('hide-callbell');
  } else {
    document.body.classList.add('hide-callbell');
  }
};

// Intenta simular un clic en el botón de apertura del chat nativo
export const openCallbellWebchat = () => {
  const widgetHost = document.getElementById('callbell-livechat-host');
  if (widgetHost) {
    // Callbell inyecta un iframe o botones dentro del div host
    // Buscamos cualquier elemento clickeable dentro del contenedor principal
    try {
      const launcherBtn = widgetHost.querySelector('[role="button"]') || widgetHost.querySelector('button');
      if (launcherBtn) {
        launcherBtn.click();
      } else {
        console.warn('Callbell Livechat launcher button not found.');
      }
    } catch (e) {
      console.error('Error attempting to open Callbell Livechat programmatically:', e);
    }
  }
};
