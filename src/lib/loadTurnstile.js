let turnstilePromise = null;

export const loadTurnstile = () => {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }

  if (turnstilePromise) {
    return turnstilePromise;
  }

  turnstilePromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(
      "cloudflare-turnstile-script",
    );

    if (existingScript) {
      if (window.turnstile) {
        resolve(window.turnstile);
      } else {
        existingScript.addEventListener("load", () => {
          resolve(window.turnstile);
        });
      }
      return;
    }

    const script = document.createElement("script");
    script.id = "cloudflare-turnstile-script";
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      resolve(window.turnstile);
    };

    script.onerror = reject;
    document.head.appendChild(script);
  });

  return turnstilePromise;
};