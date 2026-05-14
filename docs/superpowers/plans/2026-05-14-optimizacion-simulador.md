# Plan de Optimización — Simulador de Préstamos COFA

> **Para agentes:** Requerido usar superpowers:subagent-driven-development o superpowers:executing-plans. Pasos con sintaxis checkbox (`- [ ]`) para tracking.

**Goal:** Mejorar el rendimiento y la experiencia del usuario del simulador de préstamos (/simulador) mediante carga diferida, memoización de componentes y optimización de estado.

**Architecture:** Carga perezosa de jspdf, React.memo en 5 componentes, y refactor opcional de useState a useReducer para reducir re-renders.

**Tech Stack:** React 18, Vite 4.5

---

## Archivo: hooks/usePDFExport.js

- [ ] **Paso 1: Import dinámico de jspdf**

Cambiar la importación estática por dinámica dentro de `generatePDF`:

```jsx
// ANTES (línea 1-2)
import { useCallback } from "react";
import { jsPDF } from "jspdf";

// DESPUÉS
import { useCallback } from "react";

export function usePDFExport(options) {
  // ... código existente sin cambios ...

  const generatePDF = useCallback(async () => {
    // Import dinámico — jspdf solo carga cuando el usuario hace clic en "Descargar PDF"
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF();
    // ... resto de la función igual desde línea 25 en adelante ...
```

- [ ] **Paso 2: Verificar en el navegador**

Ejecutar `npm run dev` → navegar a `/simulador` → completar flujo → en el modal de info hacer clic en "Descargar PDF" → verificar que el PDF se genera sin errores.


## Archivos: components/SimulationStep/SimulationStep.jsx

- [ ] **Paso 1: Agregar React.memo**

```jsx
// ANTES
import React from "react";
// ... imports ...
export default SimulationStep;

// DESPUÉS
import React, { memo } from "react";
// ... imports ...
export default memo(SimulationStep);
```


## Archivo: components/ComplianceStep/ComplianceStep.jsx

- [ ] **Paso 1: Agregar React.memo**

```jsx
import React, { memo } from "react";
// ... resto de imports ...
export default memo(ComplianceStep);
```

Nota: El componente ya usa `useMemo` para `renderedContent` (línea 61) — mantener ese uso. Solo envolver con `memo()` la exportación.


## Archivo: components/CBUValidation/CBUValidation.jsx

- [ ] **Paso 1: Agregar React.memo**

```jsx
import React, { memo } from "react";
// ... resto de imports ...
export default memo(CBUValidation);
```


## Archivo: components/EmailValidation/EmailValidation.jsx

- [ ] **Paso 1: Agregar React.memo**

```jsx
import React, { memo } from "react";
// ... resto de imports ...
export default memo(EmailValidation);
```


## Archivo: components/OTPValidation/OTPValidation.jsx

- [ ] **Paso 1: Agregar React.memo**

```jsx
import React, { memo } from "react";
// ... resto de imports ...
export default memo(OTPValidation);
```


## Archivo: hooks/useLoanSimulator.js (OPCIONAL — riesgo medio)

Esta tarea es opcional. Solo hacerla si las anteriores están completas y hay tiempo. Tiene riesgo medio porque cambia la estructura del estado.

- [ ] **Paso 1: Reemplazar múltiples useState por useReducer**

```jsx
// Agregar al inicio del archivo:
import { useReducer } from 'react';

// Reducer fuera del hook:
const LOAN_ACTIONS = {
  SET_AMOUNT: 'SET_AMOUNT',
  SET_INSTALLMENT: 'SET_INSTALLMENT',
  SET_SIMULATION_DATA: 'SET_SIMULATION_DATA',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_STEP: 'SET_STEP',
  SET_EMAIL: 'SET_EMAIL',
  SET_CBU: 'SET_CBU',
  SET_LOAN_INFO: 'SET_LOAN_INFO',
  SET_LOADING_MODAL: 'SET_LOADING_MODAL',
  // ... el resto de las acciones para los 14+ estados
};

const initialState = {
  amount: null,
  installment: null,
  simulationData: null,
  loading: false,
  validating: false,
  error: null,
  scoringData: null,
  step: 1,
  email: '',
  cbu: '',
  loanInfo: null,
  loadingModal: false,
  existingCompliance: null,
  bancoEncontrado: null,
  codigoBancoError: null,
  validandoBanco: false,
};

function loanReducer(state, action) {
  switch (action.type) {
    case LOAN_ACTIONS.SET_AMOUNT:
      return { ...state, amount: action.payload };
    case LOAN_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    // ... todos los casos
    default:
      return state;
  }
}

// Dentro del hook:
const [state, dispatch] = useReducer(loanReducer, initialState);

// Reemplazar cada useState individual por dispatch({ type: ..., payload: ... })
// Ejemplo:
// ANTES: const [amount, setAmount] = useState(null);
// DESPUÉS: const [state, dispatch] = useReducer(...)
// Uso: dispatch({ type: LOAN_ACTIONS.SET_AMOUNT, payload: 100000 })
```

- [ ] **Paso 2: Consolidar efectos duplicados**

Encontrar los dos `useEffect` que llaman a `fetchSimulation`. Dejar solo uno:

```jsx
// ANTES (dos efectos):
useEffect(() => { fetchSimulation(); }, [scoringData.scoringId, fetchSimulation]);
useEffect(() => { fetchSimulation(); }, [debouncedAmount, scoringData.scoringId, fetchSimulation]);

// DESPUÉS (uno solo):
useEffect(() => {
  if (scoringData?.scoringId) {
    fetchSimulation();
  }
}, [debouncedAmount, scoringData?.scoringId, fetchSimulation]);
```

- [ ] **Paso 3: Testing completo del simulador**

Ejecutar `npm run dev` → navegar a `/simulador` → hacer una simulación completa (todos los pasos) → verificar:
- El slider de monto funciona
- Los cálculos muestran correctamente
- El flujo de email/OTP/CBU funciona
- El modal de info del préstamo se abre
- La descarga de PDF funciona


## Verificación Final del Simulador

1. `npm run build` — sin errores
2. `npm run dev` — navegar a `/simulador`
3. Completar flujo completo: SimulationStep → ComplianceStep → EmailValidation → OTPValidation → CBUValidation → LoanInfoModal → Descargar PDF
4. Probar con el slider deamount — verificar que no hay llamadas redundantes a la API (ver en DevTools Network)
5. PageSpeed Insights — apuntar a INP < 200ms en mobile


## Notas

- Tareas 6 y 7 son de riesgo BAJO — hacer primero
- Tarea 8 es OPCIONAL y de riesgo MEDIO — solo si hay tiempo después de completar 6 y 7
- El hook useLoanSimulator.js tiene 530 líneas — si se decide hacer la tarea 8, leer el archivo completo primero para entender todas las dependencias