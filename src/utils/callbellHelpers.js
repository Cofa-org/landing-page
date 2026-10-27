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

// Tuning del polling para `openCallbellWebchat`. El script de Callbell
// carga async (en el `window.onload` definido en `index.html`) y el
// widget renderiza el launcher button con un delay adicional. Sin
// polling, un click inmediato en el step advisor (poco después del
// primer render del step) puede perder la carrera con el inyectado
// del widget. Constantes ajustables si el warning se vuelve común.
const OPEN_POLL_INTERVAL_MS = 100;
const OPEN_POLL_MAX_ATTEMPTS = 30; // 3 segundos total

// Selectores que probamos en orden. El primero que matchea gana. El
// widget moderno de Callbell usa shadow DOM para encapsular el launcher
// — por eso también descendemos recursivamente en shadow roots (ver
// `findLauncher` abajo). El selector de iframe es el último fallback
// porque si el launcher está dentro de un iframe cross-origin, no
// podemos acceder a su contentDocument (sería una excepción de
// seguridad); en ese caso clickear el iframe mismo es lo mejor que
// podemos hacer.
const LAUNCHER_SELECTORS = [
  '[role="button"]',
  'button',
  'a[href]',
  '[aria-label*="chat" i]',
  '[class*="launcher" i]',
  'iframe',
];

// Busca un launcher clickeable dentro de `root`, descendiendo
// recursivamente en shadow roots. Devuelve el primer match o null.
const findLauncher = (root) => {
  if (!root) return null;
  for (const sel of LAUNCHER_SELECTORS) {
    const el = root.querySelector(sel);
    if (el) return el;
  }
  // Shadow DOM: el host expone `shadowRoot` y el launcher vive adentro.
  if (root.shadowRoot) {
    const shadowLauncher = findLauncher(root.shadowRoot);
    if (shadowLauncher) return shadowLauncher;
  }
  // Otros sub-trees (poco común pero posible): iframe same-origin o
  // shadow roots anidados. Recorremos los children buscando otros
  // shadow roots.
  const all = root.querySelectorAll('*');
  for (const el of all) {
    if (el.shadowRoot) {
      const found = findLauncher(el.shadowRoot);
      if (found) return found;
    }
  }
  return null;
};

// Intenta simular un clic en el botón de apertura del chat nativo.
// Polling con reintentos: el widget puede no estar listo al primer
// intento. La función retorna inmediatamente; el click ocurre cuando
// el widget esté disponible (o se loguea warn al agotar los intentos).
export const openCallbellWebchat = () => {
  let attempts = 0;

  const tryClick = () => {
    attempts += 1;

    let widgetHost = null;
    try {
      widgetHost = document.getElementById('callbell-livechat-host');
    } catch (e) {
      console.error('Error querying Callbell host:', e);
      return;
    }

    if (!widgetHost) {
      if (attempts < OPEN_POLL_MAX_ATTEMPTS) {
        setTimeout(tryClick, OPEN_POLL_INTERVAL_MS);
      } else {
        console.warn('Callbell Livechat host not found after timeout.');
      }
      return;
    }

    const launcherBtn = findLauncher(widgetHost);
    if (launcherBtn) {
      try {
        launcherBtn.click();
      } catch (e) {
        console.error('Error clicking Callbell launcher:', e);
      }
      return;
    }

    if (attempts < OPEN_POLL_MAX_ATTEMPTS) {
      setTimeout(tryClick, OPEN_POLL_INTERVAL_MS);
    } else {
      // Log diagnóstico: ayuda a entender qué hay dentro del host
      // si el selector falla. Útil para ajustar LAUNCHER_SELECTORS.
      const childCount = widgetHost.children.length;
      const hasShadow = Boolean(widgetHost.shadowRoot);
      const tagPreview = widgetHost.innerHTML.slice(0, 200);
      console.warn(
        'Callbell Livechat launcher button not found after timeout. ' +
          `host children=${childCount}, hasShadowRoot=${hasShadow}, ` +
          `innerHTMLPreview=${JSON.stringify(tagPreview)}`,
      );
    }
  };

  tryClick();
};
