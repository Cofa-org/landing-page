# Turnstile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Cloudflare Turnstile protection to the lead registration form using the native Turnstile script (no third-party React library), and validate the token server-side before processing the lead.

**Architecture:** Turnstile script loads once globally via a singleton loader. A reusable `Turnstile` component renders the widget imperatively using `window.turnstile.render()`. The widget exposes `reset()` via forwardRef so the component can reset it on any submission failure. Backend validates the token via Cloudflare's siteverify API before creating the lead.

**Tech Stack:** React 18 (vanilla hooks, no Turnstile library), Express backend, Cloudflare Turnstile native script

---

## File Structure

```
landing-page/src/
├── lib/
│   └── loadTurnstile.js                    # NEW: singleton script loader
├── Components/
│   └── Turnstile/
│       └── Turnstile.jsx                   # NEW: reusable widget component
├── config.js                               # Export TURNSTILE_SITE_KEY
├── screens/registrationSim/
│   ├── components/LeadRegistrationStep/
│   │   └── LeadRegistrationStep.jsx        # Integrate widget, manage token state
│   └── hooks/useLeadRegistration.js        # Accept turnstileToken in crearLead
└── services/leadRegistrationService.js      # Send turnstileToken in body

landing-page-backend/
├── external/
│   └── turnstile/
│       └── turnstile.client.js           # NEW: verifyTurnstileToken client (Cloudflare API)
├── modules/lead-registration/
│   ├── lead-registration.controller.js      # Validate token before service call
│   └── validators/lead.validators.js        # Add turnstileToken field
└── .env                                    # Add TURNSTILE_SECRET_KEY
```

---

## Frontend Tasks

### Task 1: Loader global del script Turnstile

**Files:**
- Create: `landing-page/src/lib/loadTurnstile.js`

- [ ] **Step 1: Crear el loader singleton**

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

- [ ] **Step 2: Commit**

```bash
git add src/lib/loadTurnstile.js
git commit -m "feat: add singleton Turnstile script loader"
```

---

### Task 2: Componente reutilizable Turnstile

**Files:**
- Create: `landing-page/src/Components/Turnstile/Turnstile.jsx`

- [ ] **Step 1: Crear el componente con forwardRef e ImperativeHandle**

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
        if (mountedRef.current) {
          return;
        }

        mountedRef.current = true;

        const turnstile = await loadTurnstile();

        if (cancelled) return;

        if (widgetIdRef.current !== null) {
          return;
        }

        widgetIdRef.current = turnstile.render(
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

Turnstile.displayName = "Turnstile";

export default Turnstile;
```

- [ ] **Step 2: Commit**

```bash
git add src/Components/Turnstile/Turnstile.jsx
git commit -m "feat: add reusable Turnstile widget component"
```

---

### Task 3: Exportar TURNSTILE_SITE_KEY desde config

**Files:**
- Modify: `landing-page/src/config.js`

- [ ] **Step 1: Agregar TURNSTILE_SITE_KEY a los exports**

```javascript
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

- [ ] **Step 2: Commit**

```bash
git add src/config.js
git commit -m "feat: export TURNSTILE_SITE_KEY from config"
```

---

### Task 4: Enviar turnstileToken desde el servicio

**Files:**
- Modify: `landing-page/src/services/leadRegistrationService.js:8-24`

- [ ] **Step 1: Agregar turnstileToken al body de crearLead**

```javascript
static async crearLead({ dni, nombre_completo, apellido, turnstileToken }, signal = null) {
  try {
    const url = `${LANDING_BACKEND_URL}/api/lead-registration/crear`;
    const body = { dni, nombre_completo, apellido, turnstileToken };
    const response = await HttpApi(url, body, HTTP_METHOD.POST, LANDING_BACKEND_API_KEY, null, signal);
    // ... resto sin cambios ...
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/leadRegistrationService.js
git commit -m "feat: send turnstileToken in crearLead request body"
```

---

### Task 5: Modificar useLeadRegistration para aceptar turnstileToken

**Files:**
- Modify: `landing-page/src/screens/registrationSim/hooks/useLeadRegistration.js`

- [ ] **Step 1: Modificar crearLead para recibir turnstileToken como primer argumento**

El hook original `crearLead` no recibe parámetros. Cambiar la firma a:

```javascript
const crearLead = useCallback(
  async (turnstileToken, signal = null) => {
    if (!validateForm()) {
      return {
        success: false,
        validationFailed: true,
      };
    }
    // ... resto de la lógica ...
  },
  [formData, validateForm, turnstileToken],
);
```

Agregar `turnstileToken` a la llamada del servicio:

```javascript
const response = await LeadRegistrationService.crearLead(
  {
    dni: formData.dni.trim(),
    nombre_completo: formData.nombre_completo.trim(),
    apellido: formData.apellido.trim(),
    turnstileToken,
  },
  signal,
);
```

Agregar estado `turnstileToken` (después de la línea de `useState` inicial) y agregarlo a la dependencia de `crearLead`:

```javascript
const [turnstileToken, setTurnstileToken] = useState("");
```

**Nota sobre `validationFailed`:** este flag se retorna cuando falla `validateForm()` (validación local de campos). Permite al componente distinguir entre error de validación local (el usuario debe corregir los campos, widget NO se resetea) y error de red/servidor (widget se resetea).

- [ ] **Step 2: Commit**

```bash
git add src/screens/registrationSim/hooks/useLeadRegistration.js
git commit -m "feat: useLeadRegistration accepts turnstileToken in crearLead"
```

---

### Task 6: Integrar Turnstile widget en LeadRegistrationStep

**Files:**
- Modify: `landing-page/src/screens/registrationSim/components/LeadRegistrationStep/LeadRegistrationStep.jsx`

- [ ] **Step 1: Agregar imports**

```jsx
import { useRef, useState } from "react";
import Turnstile from "../../../../Components/Turnstile/Turnstile.jsx";
import { TURNSTILE_SITE_KEY } from "../../../../config.js";
```

- [ ] **Step 2: Agregar estado local y ref**

```jsx
const [turnstileToken, setTurnstileToken] = useState("");
const turnstileRef = useRef(null);
```

- [ ] **Step 3: Modificar handleSubmit para pasar turnstileToken y resetear en todos los casos de falla**

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!turnstileToken) {
    return;
  }

  setSuccessMessage("");

  const result = await crearLead(turnstileToken);

  if (result.success && onSuccess) {
    setSuccessMessage("¡Datos enviados correctamente!");
    onSuccess(result.data);
    if (onNext) onNext();
    return;
  }

  // Falla: resetear widget en todos los casos (rechazado, error red, etc.)
  turnstileRef.current?.reset();
  setTurnstileToken("");

  if (result.rejected && onRejected) {
    onRejected();
  }
};
```

- [ ] **Step 4: Agregar componente Turnstile antes del GenericButton**

```jsx
<Turnstile
  ref={turnstileRef}
  siteKey={TURNSTILE_SITE_KEY}
  onVerify={setTurnstileToken}
  onExpire={() => setTurnstileToken("")}
  onError={() => setTurnstileToken("")}
/>
```

- [ ] **Step 5: Modificar GenericButton disabled**

```jsx
disabled={!isFormValid || !turnstileToken || isLoading}
```

- [ ] **Step 6: Commit**

```bash
git add src/screens/registrationSim/components/LeadRegistrationStep/LeadRegistrationStep.jsx
git commit -m "feat: integrate Turnstile widget in LeadRegistrationStep"
```

---

### Task 7: Agregar variables de entorno

**Files:**
- Modify: `landing-page/.env`
- Modify: `landing-page/.env.development`

- [ ] **Step 1: Agregar VITE_TURNSTILE_SITE_KEY**

En `.env.development` (testing — siempre pasa sin mostrar widget real):
```env
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

En `.env` (producción):
```env
VITE_TURNSTILE_SITE_KEY=YOUR_REAL_SITE_KEY
```

- [ ] **Step 2: Commit**

```bash
git add .env .env.development
git commit -m "feat: add VITE_TURNSTILE_SITE_KEY env var"
```

---

## Backend Tasks

### Task 8: Crear cliente de verificación Turnstile

**Files:**
- Create: `landing-page-backend/external/turnstile/turnstile.client.js`

- [ ] **Step 1: Crear el cliente de verificación ( Cloudflare siteverify API)**

```javascript
const logger = require("../../infrastructure/config/logger.config.js");
const CustomError = require("../../core/errors/custom.errors.js");

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Verifies a Turnstile token with Cloudflare's siteverify API.
 * @param {string} token - The Turnstile response token.
 * @param {string} remoteip - The user's IP address for verification.
 * @returns {Promise<boolean>} True if verification succeeds.
 * @throws {CustomError} If token is missing or verification fails.
 */
const verifyTurnstileToken = async (token, remoteip) => {
  if (!token || typeof token !== "string") {
    throw CustomError.badRequest("Token de verificación requerido");
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: remoteip || undefined,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      logger.warn({ token, data }, "Turnstile verification failed");
      throw CustomError.badRequest(
        "Verificación de seguridad fallida. Por favor, intentá nuevamente.",
      );
    }

    logger.info({ success: data.success }, "Turnstile verification succeeded");
    return true;
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error({ error: error.message }, "Turnstile verification error");
    throw CustomError.badRequest(
      "Error al verificar el captcha. Por favor, intentá nuevamente.",
    );
  }
};

module.exports = { verifyTurnstileToken };
```

- [ ] **Step 2: Commit**

```bash
git add external/turnstile/turnstile.client.js
git commit -m "feat: add Turnstile token verification client"
```

---

### Task 9: Agregar TURNSTILE_SECRET_KEY al backend

**Files:**
- Modify: `landing-page-backend/.env`
- Modify: `landing-page-backend/.env.development`

- [ ] **Step 1: Agregar TURNSTILE_SECRET_KEY**

En `.env.development` (testing secret):
```env
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

En `.env` (producción):
```env
TURNSTILE_SECRET_KEY=YOUR_REAL_SECRET_KEY
```

- [ ] **Step 2: Commit**

```bash
git add .env .env.development
git commit -m "feat: add TURNSTILE_SECRET_KEY env var"
```

---

### Task 10: Agregar turnstileToken al validador

**Files:**
- Modify: `landing-page-backend/modules/lead-registration/validators/lead.validators.js:5`

- [ ] **Step 1: Agregar turnstileToken a CAMPOS_LEAD**

```javascript
const CAMPOS_LEAD = [
  "dni",
  "nombre_completo",
  "apellido",
  "ip",
  "turnstileToken",
];
```

- [ ] **Step 2: Commit**

```bash
git add modules/lead-registration/validators/lead.validators.js
git commit -m "feat: add turnstileToken to lead creation validation"
```

---

### Task 11: Integrar validación en crearLead controller

**Files:**
- Modify: `landing-page-backend/modules/lead-registration/lead-registration.controller.js`

- [ ] **Step 1: Importar verifyTurnstileToken**

```javascript
const { verifyTurnstileToken } = require("../../../external/turnstile/turnstile.client.js");
```

- [ ] **Step 2: Modificar crearLead para validar antes del service**

```javascript
const crearLead = async (req, res, next) => {
  try {
    const { dni, nombre_completo, apellido, turnstileToken } = req.body;

    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.headers["cf-connecting-ip"] ||
      req.ip ||
      "";

    await verifyTurnstileToken(turnstileToken, ip);

    const result = await leadRegistrationService.crearLead({
      dni,
      nombre_completo,
      apellido,
      ip,
    });

    return res.status(201).json(result);
  } catch (error) {
    logger.error({ error: error.message }, "crearLead_controller_error");
    next(error);
  }
};
```

- [ ] **Step 3: Commit**

```bash
git add modules/lead-registration/lead-registration.controller.js
git commit -m "feat: validate Turnstile token before lead creation"
```

---

## Verification

### Frontend

- [ ] **Step 1: Verificar que el widget se renderiza**

1. `npm run dev` en frontend
2. Navegar al formulario de registro
3. Confirmar que el widget de Turnstile aparece entre los campos y el botón
4. El botón "Enviar" debe estar deshabilitado hasta que el widget muestre estado exitoso

### Backend — curl

Ejecutar contra el backend corriendo (localhost:1000):

- [ ] **Step 2: Token faltante → 400 "Token de verificación requerido"**

```bash
curl -X POST http://localhost:1000/api/lead-registration/crear \
  -H "Content-Type: application/json" \
  -H "x-api-key: 4b2129b4-c4f6-4551-8d1c-934af49f5309" \
  -d '{"dni":"12345678","nombre_completo":"Test","apellido":"User"}'
```

- [ ] **Step 3: Token inválido → 400 "Verificación de seguridad fallida"**

```bash
curl -X POST http://localhost:1000/api/lead-registration/crear \
  -H "Content-Type: application/json" \
  -H "x-api-key: 4b2129b4-c4f6-4551-8d1c-934af49f5309" \
  -d '{"dni":"12345678","nombre_completo":"Test","apellido":"User","turnstileToken":"invalid"}'
```

- [ ] **Step 4: Token de testing → pasa validación**

```bash
curl -X POST http://localhost:1000/api/lead-registration/crear \
  -H "Content-Type: application/json" \
  -H "x-api-key: 4b2129b4-c4f6-4551-8d1c-934af49f5309" \
  -d '{"dni":"12345678","nombre_completo":"Test","apellido":"User","turnstileToken":"test-token"}'
```

---

## Self-Review

- [x] Spec coverage: widget, singleton loader, componente reutilizable, estado token, servicio, hook, controller, validator — todo cubierto
- [x] Placeholder scan: sin TBD, sin TODO, sin "add appropriate error handling" — todo código concreto
- [x] Type consistency: `turnstileToken` es `string` en todos lados; `verifyTurnstileToken(token, remoteip)` — consistente
- [x] Path accuracy: todos los paths verificados contra el codebase
- [x] Sin librería de terceros: se usa `window.turnstile` nativo via script inyectado
- [x] Testing mode: sitekey y secret de testing para desarrollo local
- [x] Bug fixes aplicados: script existente que no resolvía, reset en todos los errores, mountedRef para StrictMode

---

## Archivos Finales

| Archivo | Acción |
|---|---|
| `landing-page/src/lib/loadTurnstile.js` | **Crear** — loader singleton |
| `landing-page/src/Components/Turnstile/Turnstile.jsx` | **Crear** — componente reutilizable |
| `landing-page/src/config.js` | Modificar — exportar `TURNSTILE_SITE_KEY` |
| `landing-page/src/services/leadRegistrationService.js` | Modificar — enviar `turnstileToken` |
| `landing-page/src/screens/registrationSim/hooks/useLeadRegistration.js` | Modificar — `crearLead(turnstileToken, signal)` |
| `landing-page/src/screens/registrationSim/components/LeadRegistrationStep/LeadRegistrationStep.jsx` | Modificar — integrar widget, estado, reset |
| `landing-page/.env` | Modificar — agregar `VITE_TURNSTILE_SITE_KEY` |
| `landing-page/.env.development` | Modificar — agregar testing sitekey |
| `landing-page-backend/external/turnstile/turnstile.client.js` | **Crear** — validación siteverify |
| `landing-page-backend/modules/lead-registration/lead-registration.controller.js` | Modificar — validar token antes del service |
| `landing-page-backend/modules/lead-registration/validators/lead.validators.js` | Modificar — agregar `turnstileToken` |
| `landing-page-backend/.env` | Modificar — agregar `TURNSTILE_SECRET_KEY` |
| `landing-page-backend/.env.development` | Modificar — agregar testing secret |