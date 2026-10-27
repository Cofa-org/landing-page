En el package.json cree el comando start que sirve la carpeta dist, esto en necesario para que railway pueda hacer un deploy.
El -s es para evitar redirecciones en una SPA
El -n dehabilita los comportamientos por defecto
El -L indica que no se alojara en el localhost 
El -p indica el puerto
El $PORT busca la variable de puerto configurada en el proyecto de railway

## Simulador de préstamos — gate de validación manual de CBU (2026-10-20)

Un lead cliente COFA **sin email en SB** (pasó por el gate de asesor
`EMAIL_PENDING_ADVISOR`) que **cambia su CBU/CVU** durante la simulación queda
esperando la validación manual de un asesor antes de poder continuar. El
backend ("parkea" la simulación) es el que dispara el gate; el front solo
refleja el estado.

### Step nuevo

`LOAN_SIM_STEPS.PENDING_CBU_VALIDATION` (`src/constants/LOAN_SIM.js`).

> El string **debe** ser idéntico a `ESTADO_SIMULACION.PENDING_CBU_VALIDATION`
> del back: `useLoanSimulator` hace `setStep(LOAN_SIM_STEPS[existingState])` al
> restaurar → si la key no existe, `setStep(undefined)` rompe la pantalla. Por
> eso el **front se despliega antes que el back**.

### Pantalla de espera

- `src/screens/LoanSim/components/PendingCbuValidation/PendingCbuValidation.jsx`
  — componente **100% presentacional** (`memo` + PropTypes). Props:
  `onContactAdvisor`, `onVerificarEstado`, `loading`, `error`. Dos botones:
  "Comunicarse con un asesor" (Callbell) y "Verificar estado". El `error` se
  muestra con `role="alert"` porque la pantalla es un dead-end: sin él, un
  refresh fallido (típicamente `SIMULADOR_SIMULATION_EXPIRED` a las 24h) sería
  mudo.
- `src/screens/LoanSim/hooks/usePendingCbuValidation.js` — expone
  `handleContactAdvisor()` (abre el chat de Callbell con
  `openCallbellWebchat`). **El "verificar estado" NO vive acá**: el routing
  (PENDING → sigue · RECHAZADO → pantalla de rechazo · CBU_VALIDATION →
  sigue el flujo) lo hace `useLoanSimulator.verificarEstadoCBU()`, que es el
  que tiene `setStep` / `setRejectionReason` y el refresh de la simulación.

### Rama "CBU ya validado" de `CBUValidation`

`CBUValidation` recibe **3 props nuevas** y las pasa al hook
`useCBUValidation` como un 4º argumento (un objeto):

| Prop | Tipo | Qué es |
|---|---|---|
| `pendingCbu` | `string` | La cuenta que ingressó el cliente (`cbu_usuario` / `cvu_usuario`). |
| `cbuValidado` | `bool` | Un asesor ya validó el cambio (`cbu_validado_por` seteado). |
| `pendingAccountType` | `"cbu" \| "cvu"` | El tipo con el que el cliente la ingresó. |

```js
useCBUValidation(isClient, existingCbu, onValidate, {
  pendingCbu,
  cbuValidado,
  pendingAccountType,
});
```

Si `cbuValidado && pendingCbu` → el componente muestra la cuenta que validó el
asesor + un botón "Continuar" (que re-valida contra el ERP y sigue el flujo).
El back **no re-gatea**: `cbu_validado_por` ya está seteado.

> `pendingAccountType` no es opcional: si el cliente ingressó un **CVU** y se
> reenvía como `"cbu"`, el back lo escribiría en `cbu_usuario` y el payload de
> ERP mandaría el CVU en el campo de CBU.

### Wiring en `LoanSimScreen.jsx`

- `PendingCbuValidation` se registra con `lazy` y se renderiza cuando
  `step === LOAN_SIM_STEPS.PENDING_CBU_VALIDATION`, con
  `onContactAdvisor={handleContactAdvisor}`,
  `onVerificarEstado={verificarEstadoCBU}` y `loading={loading || validating}`.
- `PENDING_CBU_VALIDATION` está **excluida de `renderBackButton()`**: es un
  callejón sin salida hasta que el operador actúe.
- Las 3 props de `CBUValidation` se derivan **de la misma fuente** (valor y
  tipo van juntos): `pendingCbu = cbu_usuario || cvu_usuario`,
  `pendingAccountType = cbu_usuario ? "cbu" : "cvu"`,
  `cbuValidado = !!cbu_validado_por`. El back escribe **solo** la columna del
  `accountType` del submit y nunca limpia la otra → si el cliente cambió de
  CBU a CVU quedan ambas pobladas, y derivar el tipo desde la columna
  equivocada emparejaría el CBU viejo con el tipo "cvu".
- El rechazo se muestra con `REJECTION_CONFIG.CBU_REJECTED`
  (`src/constants/LOAN_SIM.js`): la causa la setea el restore cuando
  `existingSimulation.motivo === "CBU_RECHAZADO_POR_ASESOR"`.

### Caso de QA — panel de test personas (2026-10-21)

El simulador de dev tiene un caso de test persona que permite ver la pantalla de
espera del CBU **sin caminar el flujo** (un click): la persona `SIM_CBU_PENDING` del
catálogo del back.

- `src/screens/LoanSim/hooks/useTestSimuladorPanel.js` — expone `aprobarCbu(id)`,
  `approvingCbu` y `cbuAprobadoPara`, y el set `PERSONAS_CON_APROBAR_CBU` (qué
  personas tienen botón). Al elegir la persona del caso, el hook **resetea el
  escenario** y navega con **full reload** (`window.location.href`): `navigate()`
  a la misma URL no re-dispara el init del simulador, y sin el reset el caso no
  sería repetible. El reload **preserva el `?testMode=1`** (sin él, el panel se
  cerraría y el botón desaparecería).
- `src/screens/LoanSim/components/TestSimuladorPanel/TestSimuladorPanel.jsx` —
  renderiza el botón "✅ Validar CBU" (hermano del botón de persona, nunca
  anidado). Con `loading`, `GenericButton` reemplaza los children por un spinner
  `aria-hidden` → el `aria-label` es obligatorio para no perder el nombre
  accesible, y tiene que **contener el texto visible** (WCAG 2.5.3).
- El approve **responde HTTP 200 en los dos casos** (aprobó / no había nada
  pendiente) → el panel mira `result.success` y `result.message`, no una
  excepción.

> El panel sólo se ve con `VITE_DEV=true` o `?testMode=1`: el gate es
> `isTestPersonasVisible()` = `parseBool(import.meta.env.VITE_DEV) || ?testMode=1`
> — **no** `import.meta.env.DEV`.

Back, spec y runbook: `landing-page-backend/modules/simulador-prestamos/simulador-prestamos.md`,
`docs/superpowers/specs/2026-10-20-pending-cbu-validation-design.md` y
`docs/superpowers/execution/2026-10-20-deploy-gate-cbu.md`.