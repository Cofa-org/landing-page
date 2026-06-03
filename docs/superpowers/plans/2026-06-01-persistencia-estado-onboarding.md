# Persistencia de estado en flujo de onboarding — Plan de implementación

**Goal:** Persistir el estado de onboarding cuando el usuario retrocede, para que al cerrar/reabrir el navegador, el estado se.restore correctamente. El patrón ya existe en `useLoanSimulator.handlePrevStep` → `SimuladorService.actualizarEstado`. Se replica para onboarding.

**Architecture:** Tres capas: Backend (ruta PUT + controller + service), Frontend (leadRegistrationService + hook). El hook `useOnboardingFlow.navigateToPrev` hará el persist igual que `useLoanSimulator.handlePrevStep`, mapeando cada step al estado backend correspondiente antes de navegar.

**Tech Stack:** Node.js/Express backend, React frontend, Supabase.

---

## Task 1: Backend — Controller

**Modificar:** `landing-page-backend/modules/lead-registration/lead-registration.controller.js`

- [ ] **Step 1: Agregar controlador `actualizarEstadoOnboarding`**

Al final del archivo, después de `obtenerEstadoOnboarding` y antes de `module.exports`:

```javascript
const actualizarEstadoOnboarding = async (req, res, next) => {
  try {
    const { leadId, estado } = req.body;

    if (!leadId || !estado) {
      return next(CustomError.badRequest("leadId y estado son requeridos"));
    }

    const result = await leadRegistrationService.actualizarEstadoOnboarding({ leadId, estado });

    return res.json(result);
  } catch (error) {
    logger.error({ error: error.message }, "actualizarEstadoOnboarding_controller_error");
    next(error);
  }
};
```

- [ ] **Step 2: Exportar en `module.exports`**

Agregar `actualizarEstadoOnboarding` al objeto exportado junto con los demás handlers.

---

## Task 2: Backend — Service

**Modificar:** `landing-page-backend/modules/lead-registration/lead-registration.service.js`

- [ ] **Step 1: Agregar método `actualizarEstadoOnboarding`**

Después de `obtenerEstadoOnboarding` (al final del service, antes del cierre `};`), agregar:

```javascript
actualizarEstadoOnboarding: async ({ leadId, estado }) => {
  try {
    logger.info({ leadId, estado }, "actualizarEstadoOnboarding_service_payload");

    if (!leadId || !estado) {
      throw CustomError.badRequest("leadId y estado son requeridos");
    }

    const updated = await leadRegistrationRepository.update(leadId, {
      estado_onboarding: estado,
    });

    if (!updated) {
      throw CustomError.notFound(ERROR_MESSAGE.LEAD_NOT_FOUND);
    }

    logger.info({ leadId, estado }, "actualizarEstadoOnboarding_service_success");

    return {
      success: true,
      message: "Estado de onboarding actualizado con éxito",
      data: updated,
    };
  } catch (error) {
    logger.error({ error: error.message }, "actualizarEstadoOnboarding_service_error");
    throw error;
  }
},
```

**Nota:** `ERROR_MESSAGE.LEAD_NOT_FOUND` ya existe en el codebase (usado en `actualizarLead`). No agregar línea nueva.

---

## Task 3: Backend — Route

**Modificar:** `landing-page-backend/infrastructure/http/routes/lead-registration.routes.js`

- [ ] **Step 1: Agregar ruta PUT**

Después de `router.put("/actualizar", jwtAuth, ...)` (línea 18), agregar:

```javascript
router.put("/actualizar-estado", jwtAuth, leadRegistrationController.actualizarEstadoOnboarding);
```

**Nota:** Todas las rutas en este archivo usan `jwtAuth`. La nueva ruta también lo usa.

---

## Task 4: Frontend — leadRegistrationService

**Modificar:** `landing-page/src/services/leadRegistrationService.js`

- [ ] **Step 1: Agregar método `actualizarEstadoOnboarding`**

Después del método `obtenerEstadoOnboarding`, agregar:

```javascript
static async actualizarEstadoOnboarding({ leadId, estado }) {
  try {
    const url = `${LANDING_BACKEND_URL}/api/lead-registration/actualizar-estado`;
    const apiKey = LANDING_BACKEND_API_KEY;
    const body = { leadId, estado };
    const response = await HttpApi(url, body, HTTP_METHOD.PUT, apiKey, null);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al actualizar estado de onboarding");
    }

    return await response.json();
  } catch (error) {
    console.error("ACTUALIZAR_ESTADO_ONBOARDING_ERROR:", error);
    throw error;
  }
}
```

**Verificación:** `HTTP_METHOD.PUT` ya existe en `src/constants/HTTP_METHODS.js`.

---

## Task 5: Frontend — useOnboardingFlow

**Modificar:** `landing-page/src/screens/registrationSim/hooks/useOnboardingFlow.js`

- [ ] **Step 1: Agregar import de LeadRegistrationService**

```javascript
import LeadRegistrationService from "../../../services/leadRegistrationService.js";
```

- [ ] **Step 2: Modificar `navigateToPrev` para persistir estado**

Reemplazar la implementación actual de `navigateToPrev` (líneas 106-111):

```javascript
const navigateToPrev = useCallback(async () => {
  const prev = PREV_STEP_MAP[onboardingStep];
  if (prev) {
    try {
      const leadId = getLeadId();
      if (leadId) {
        // Mapear step actual → estado backend para persistir
        const estadoMap = {
          [LOAN_SIM_STEPS.DNI_UPLOAD]: "LEAD_CREADO",
          [LOAN_SIM_STEPS.RECIBO_UPLOAD]: "DNI_SUBIDO",
          [LOAN_SIM_STEPS.WELCOME]: "RECIBO_SUBIDO",
        };
        const estadoBackend = estadoMap[onboardingStep];
        if (estadoBackend) {
          await LeadRegistrationService.actualizarEstadoOnboarding({
            leadId,
            estado: estadoBackend,
          });
        }
      }
    } catch (err) {
      console.error("Error al sincronizar estado de onboarding:", err);
    }
    setOnboardingStep(prev);
  }
}, [onboardingStep, getLeadId]);
```

**Verificación de dependencias:**
- `getLeadId` → línea 139: `return leadData?.leadId ?? null;`
- `leadData` se setea en línea 83: `setLeadData(response.data)` donde `response.data` viene de `obtenerEstadoOnboarding` que retorna `{ leadId: lead.id, ... }`
- `LOAN_SIM_STEPS` ya está importado en línea 2

---

## Task 6: Verificación

- [ ] **Step 1: Build backend**

```bash
cd landing-page-backend && npm run dev
```

- [ ] **Step 2: Build frontend**

```bash
npm run build
```

- [ ] **Step 3: Test manual**

1. Navegar a `/registro-simulador`
2. Completar paso LEAD_REGISTRATION
3. Avanzar a DNI_UPLOAD, hacer click en Volver
4. Refrescar la página
5. Verificar que el estado se.restore a LEAD_REGISTRATION (no a DNI_UPLOAD)

---

## Archivos a modificar (resumen)

| Capa | Archivo | Cambio |
|------|---------|--------|
| Backend | `modules/lead-registration/lead-registration.controller.js` | Agregar `actualizarEstadoOnboarding` |
| Backend | `modules/lead-registration/lead-registration.service.js` | Agregar `actualizarEstadoOnboarding` |
| Backend | `infrastructure/http/routes/lead-registration.routes.js` | Agregar `PUT /actualizar-estado` |
| Frontend | `src/services/leadRegistrationService.js` | Agregar `actualizarEstadoOnboarding` |
| Frontend | `src/screens/registrationSim/hooks/useOnboardingFlow.js` | Modificar `navigateToPrev` |

---

## Self-Review Checklist

**Spec coverage:**
- [x] Ruta backend nueva — Task 3
- [x] Controller nuevo — Task 1
- [x] Service nuevo — Task 2
- [x] Servicio frontend nuevo — Task 4
- [x] Integración en hook — Task 5
- [x] Verificación — Task 6

**Placeholder scan:**
- [x] Sin TBD, TODO, implement later
- [x] Sin vaguedades tipo "agregar apropiado error handling"
- [x] Código completo en cada step

**Type consistency:**
- [x] `leadId`的一致性: controller usa `leadId`, service lo recibe como `leadId`, frontend lo pasa como `leadId`
- [x] `estado`的一致性: string exacto `LEAD_CREADO`, `DNI_SUBIDO`, `RECIBO_SUBIDO`
- [x] `getLeadId()` en hook retorna `leadData?.leadId` —没错

**Path accuracy:**
- [x] Todos los paths son exactos y relatifs al root del proyecto
- [x] Los números de línea mencionados son pointers al código existente (no se modifican, solo se indica dónde agregar)