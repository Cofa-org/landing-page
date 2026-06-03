# Integración de Cloudflare Turnstile en React 18

## Objetivo

Integrar Cloudflare Turnstile en el flujo de registro de leads:

* Carga global única del script.
* Compatible con React 18 y StrictMode.
* Evita renderizados duplicados.
* Permite resetear el widget cuando el backend rechaza la solicitud.
* Mantiene la responsabilidad del captcha en la UI.
* Envía el token al backend junto con los datos del formulario.

---

# 1. Loader global

Archivo:

```text
src/lib/loadTurnstile.js
```

```js
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
      // Si el script ya existe pero turnstile aún no está listo
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
```

---

# 2. Componente Turnstile

Archivo:

```text
src/Components/Turnstile/Turnstile.jsx
```

```jsx
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import { loadTurnstile } from "../../lib/loadTurnstile";

const Turnstile = forwardRef(
  (
    {
      siteKey,
      onVerify,
      onExpire,
      onError,
    },
    ref,
  ) => {
    const containerRef = useRef(null);

    const widgetIdRef = useRef(null);

    const mountedRef = useRef(false);

    useImperativeHandle(ref, () => ({
      reset() {
        if (
          widgetIdRef.current !== null &&
          window.turnstile
        ) {
          window.turnstile.reset(
            widgetIdRef.current,
          );
        }
      },
    }));

    useEffect(() => {
      let cancelled = false;

      const initialize = async () => {
        // Previene doble inicialización
        if (mountedRef.current) {
          return;
        }

        mountedRef.current = true;

        const turnstile =
          await loadTurnstile();

        if (cancelled) return;

        // Si ya se renderizó mientras ожидание, salir
        if (
          widgetIdRef.current !== null
        ) {
          return;
        }

        widgetIdRef.current =
          turnstile.render(
            containerRef.current,
            {
              sitekey: siteKey,

              callback(token) {
                onVerify?.(token);
              },

              "expired-callback"() {
                onExpire?.();
              },

              "error-callback"(error) {
                onError?.(error);
              },
            },
          );
      };

      initialize();

      return () => {
        cancelled = true;

        if (
          widgetIdRef.current !== null &&
          window.turnstile
        ) {
          try {
            window.turnstile.remove(
              widgetIdRef.current,
            );
          } catch {
            // Turnstile puede lanzar si el widget ya fue removido
          }
        }

        widgetIdRef.current = null;
        mountedRef.current = false;
      };
    }, [
      siteKey,
      onVerify,
      onExpire,
      onError,
    ]);

    return <div ref={containerRef} />;
  },
);

Turnstile.displayName =
  "Turnstile";

export default Turnstile;
```

---

# 3. Hook useLeadRegistration

La modificación es recibir `turnstileToken` y enviarlo al backend. **Se mantiene `validateForm()`** y se retorna `{ success: false, validationFailed: true }` cuando falla, para que el componente pueda distinguir una validación local de un error de red.

```js
const crearLead =
  useCallback(
    async (
      turnstileToken,
      signal = null,
    ) => {
      if (!validateForm()) {
        return {
          success: false,
          validationFailed: true,
        };
      }

      setIsSubmitting(true);
      setSubmitError("");

      try {
        const response =
          await LeadRegistrationService.crearLead(
            {
              dni:
                formData.dni.trim(),
              nombre_completo:
                formData.nombre_completo.trim(),
              apellido:
                formData.apellido.trim(),
              turnstileToken,
            },
            signal,
          );

        if (
          response.success &&
          response.data
        ) {
          await setCookie(
            COOKIE_LEAD_TOKEN_CONFIG.NAME,
            response.data.token,
            COOKIE_LEAD_TOKEN_CONFIG.EXPIRY_MS,
          );

          return {
            success: true,
            data: {
              lead: response.data.lead,
              token:
                response.data.token,
              scoringId:
                response.data.lead
                  .id_scoring,
              nombreCompleto: `${formData.nombre_completo.trim()} ${formData.apellido.trim()}`,
            },
          };
        }

        const isScoringRechazado =
          response.cause ===
            ERROR_CAUSE.SCORING_RECHAZADO ||
          (response.message &&
            response.message.includes(
              ERROR_MESSAGE.SCORING_RECHAZADO,
            ));

        if (
          isScoringRechazado
        ) {
          return {
            success: false,
            rejected: true,
          };
        }

        setSubmitError(
          response.message ||
            "Error al registrar. Intentá nuevamente.",
        );

        return {
          success: false,
        };
      } catch (err) {
        console.error(
          "LEAD_REGISTRATION_ERROR:",
          err,
        );

        if (
          err.name ===
          "AbortError"
        ) {
          return {
            success: false,
            aborted: true,
          };
        }

        const isScoringRechazado =
          err.cause ===
            ERROR_CAUSE.SCORING_RECHAZADO ||
          (err.message &&
            err.message.includes(
              ERROR_MESSAGE.SCORING_RECHAZADO,
            ));

        if (
          isScoringRechazado
        ) {
          return {
            success: false,
            rejected: true,
          };
        }

        const msg =
          err.message ||
          "Error de conexión. Intentá nuevamente.";

        setSubmitError(msg);

        return {
          success: false,
          error: msg,
        };
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, validateForm],
  );
```

**Nota:** `validationFailed: true` solo se retorna cuando falla `validateForm()`. El componente usa esto para decidir si resetear el widget (error de red/servidor) o no (validación local, el usuario debe corregir los campos primero).

---

# 4. LeadRegistrationStep

Agregar imports:

```jsx
import { useRef, useState } from "react";
import Turnstile from "../../../../Components/Turnstile/Turnstile.jsx";
import { TURNSTILE_SITE_KEY } from "../../../../config.js";
```

Agregar estado:

```jsx
const [turnstileToken, setTurnstileToken] =
  useState("");

const turnstileRef = useRef(null);
```

Modificar submit — resetea el widget en **todos** los casos de falla (rechazado, error de red, o falla de validación):

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!turnstileToken) {
    return;
  }

  setSuccessMessage("");

  const result =
    await crearLead(
      turnstileToken,
    );

  if (
    result.success &&
    onSuccess
  ) {
    setSuccessMessage(
      "¡Datos enviados correctamente!",
    );

    onSuccess(result.data);

    if (onNext) {
      onNext();
    }

    return;
  }

  // Falla: resetear widget en todos los casos
  turnstileRef.current?.reset();
  setTurnstileToken("");

  if (
    result.rejected &&
    onRejected
  ) {
    onRejected();
  }
};
```

Agregar Turnstile antes del botón, usando `TURNSTILE_SITE_KEY` de config:

```jsx
<Turnstile
  ref={turnstileRef}
  siteKey={TURNSTILE_SITE_KEY}
  onVerify={setTurnstileToken}
  onExpire={() =>
    setTurnstileToken("")
  }
  onError={() =>
    setTurnstileToken("")
  }
/>
```

Modificar botón:

```jsx
<GenericButton
  type="submit"
  loading={isLoading}
  disabled={
    !isFormValid ||
    !turnstileToken ||
    isLoading
  }
>
  Enviar
</GenericButton>
```

---

# 5. Variables de entorno

**Archivo:** `src/config.js`

```js
const LANDING_BACKEND_URL = import.meta.env.VITE_LANDING_BACKEND_URL;
const LANDING_BACKEND_API_KEY = import.meta.env.VITE_LANDING_BACKEND_API_KEY;
const LRS_URL = import.meta.env.VITE_LRS_URL;
const LRS_API_KEY = import.meta.env.VITE_LRS_API_KEY;
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

export {
  LANDING_BACKEND_URL,
  LANDING_BACKEND_API_KEY,
  LRS_URL,
  LRS_API_KEY,
  TURNSTILE_SITE_KEY,
};
```

Desarrollo `.env.development`:

```env
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

Producción `.env`:

```env
VITE_TURNSTILE_SITE_KEY=TU_SITE_KEY_REAL
```

---

# 6. Payload enviado al backend

```json
{
  "dni": "12345678",
  "nombre_completo": "Juan Carlos",
  "apellido": "García",
  "turnstileToken": "TOKEN_GENERADO_POR_CLOUDFLARE"
}
```

---

# 7. Resumen de correcciones aplicadas al diseño previo

| # | Problema | Corrección |
|---|---|---|
| 1 | Branch `existingScript` nunca resolvía la promesa cuando el script ya existía | Se agrega `if (window.turnstile) resolve(window.turnstile)` antes del addEventListener |
| 2 | `validateForm()` se eliminó | Se mantiene la llamada y se retorna `{ validationFailed: true }` para distinguir de errores de red |
| 3 | Errores no-rechazados no reseteaban el widget | Se resetea el widget en **todos** los casos de falla del handleSubmit |
| 4 | `siteKey` usaba `import.meta.env` directo en vez de `config.js` | Se importa `TURNSTILE_SITE_KEY` desde `config.js` |
| 5 | Sin `mountedRef` la doble inicialización podía ocurrir en StrictMode | Se agrega `mountedRef` que se setea en `true` antes del async y se resetea en cleanup |

---

# 8. Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `src/lib/loadTurnstile.js` | **Crear** — loader singleton del script |
| `src/Components/Turnstile/Turnstile.jsx` | **Crear** — componente reutilizable |
| `src/Components/Turnstile/Turnstile.module.css` | Crear — estilos opcionales del contenedor |
| `src/config.js` | Modificar — agregar `TURNSTILE_SITE_KEY` |
| `src/screens/registrationSim/hooks/useLeadRegistration.js` | Modificar — aceptar `turnstileToken` en `crearLead`, mantener `validateForm()` |
| `src/screens/registrationSim/components/LeadRegistrationStep/LeadRegistrationStep.jsx` | Modificar — integrar `<Turnstile>`, estado del token, reset en errores |
| `.env` | Modificar — agregar `VITE_TURNSTILE_SITE_KEY` |
| `.env.development` | Modificar — agregar testing sitekey |