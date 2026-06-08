# Plan: crearLead debe persistir lead aunque scoring sea RECHAZAR

## Context

En `crearLead` actualmente cuando `scoringData.scoring?.estado_scoring_final === ESTADO_SCORING.RECHAZAR`, se lanza el error `CustomError.forbidden` sin crear el lead en la base de datos. El usuario requiere que el lead sea creado (con `estado_scoring = RECHAZAR`) **antes** de lanzar el error, para que el rechazo quede registrado.

## Cambio en `crearLead`

**Archivo:** `landing-page-backend/modules/lead-registration/lead-registration.service.js`

### Lógica actual (líneas 28-31):

```javascript
// 2. Si el scoring fue rechazado, rechazar el registro
if (scoringData.scoring?.estado_scoring_final === ESTADO_SCORING.RECHAZAR) {
  throw CustomError.forbidden(ERROR_MESSAGE.SCORING_RECHAZADO, ERROR_CAUSE.SCORING_RECHAZADO);
}
```

### Nueva lógica:

```javascript
// 2. Si el scoring fue rechazado, crear lead con estado_scoring RECHAZAR y luego rechazar
if (scoringData.scoring?.estado_scoring_final === ESTADO_SCORING.RECHAZAR) {
  const leadDataRechazado = {
    dni,
    nombre_completo: nombre_completo,
    apellido,
    ip: ip || null,
    id_scoring: scoringData.id_scoring,
    estado_onboarding: ESTADO_REGISTRO.PENDIENTE,
    estado_scoring: ESTADO_SCORING.RECHAZAR,
    estado_prescoring: scoringData.estado_scoring_final,
  };
  await leadRegistrationRepository.create(leadDataRechazado);
  throw CustomError.forbidden(ERROR_MESSAGE.SCORING_RECHAZADO, ERROR_CAUSE.SCORING_RECHAZADO);
}
```

**Nota:** Se usa `ESTADO_REGISTRO.PENDIENTE` (ya existente en el codebase) para `estado_onboarding` ya que el lead no avanza a onboarding — es un lead rechazado. `ESTADO_SCORING.RECHAZAR` viene de `ESTADO_SCORING` importado en línea 7.

## Verificación

- [ ] `npm run dev` en backend — sin errores de sintaxis
- [ ] Revisar que `ESTADO_REGISTRO.PENDIENTE` y `ESTADO_SCORING.RECHAZAR` existen en `core/constants/states.constants.js`

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `landing-page-backend/modules/lead-registration/lead-registration.service.js` | En `crearLead`, crear lead con `estado_scoring: ESTADO_SCORING.RECHAZAR` antes de lanzar error |

## Self-Review

- [x] Spec coverage: solo un cambio en un método
- [x] Placeholder scan: sin TBD, sin vaguedades
- [x] Type consistency: `ESTADO_REGISTRO.PENDIENTE` y `ESTADO_SCORING.RECHAZAR` ya están en el codebase, importados en línea 7
- [x] Path accuracy: archivo exacto