# ⚠️ Estado de los Tests

## Problema Conocido

Los tests de integración **no están funcionando** actualmente debido a un conflicto entre:

1. **Jest** como framework de testing
2. **ESM nativo** (`"type": "module"` en package.json)
3. **Imports con extensión .js** requeridos por ESM

### Error Principal

```
Configuration error:
Could not locate module ../index.js mapped as: $1.
```

### Causa

Jest tiene dificultades para resolver imports con extensión `.js` cuando se usa ESM nativo. El `moduleNameMapper` no funciona correctamente en este escenario.

## Soluciones Posibles

### Opción 1: Usar Mocha + Chai (Recomendada)
Migrar los tests a Mocha que tiene mejor soporte para ESM nativo.

### Opción 2: Eliminar type: module
Convertir el proyecto a CommonJS (no recomendado, es un paso atrás).

### Opción 3: Configurar Jest correctamente
Se necesita investigar más a fondo la configuración correcta de Jest con ESM.

## Scripts Afectados

- `npm test`
- `npm run test:watch`
- `npm run test:coverage`

## Alternativa Temporal

Para validar que el backend funciona:

```bash
# Usar la aplicación directamente
npm run dev

# Probar endpoints con curl o Postman
curl http://localhost:3001/health
```

## Documentación

Para más información sobre el problema:
- https://jestjs.io/docs/ecmascript-modules
- https://github.com/facebook/jest/issues/9430

---

**Estado:** 🔧 En progreso - necesita atención futura