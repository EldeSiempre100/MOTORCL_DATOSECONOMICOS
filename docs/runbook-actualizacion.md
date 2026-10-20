# Operación — Actualización y publicación MotorCL

## Desarrollo y validación

En el repositorio, con Node 24 y las dependencias instaladas:

1. npm ci
2. npm run update:data
3. npm run test:data
4. npm run build

La ingesta necesita acceso HTTPS saliente a INE/SIMEL y Mindicador. No requiere API Keys. El job se ejecuta todos los días a las 12:00 UTC y admite workflow_dispatch. El workflow está en .github/workflows/update-data.yml.

## Evidencia que debe revisarse

- data/ingestion-status.json: runId, estado por fuente, errores, período y conteos de observaciones/revisiones.
- public/data/ingestion-status.json: auditoría visible desde HTTP.
- public/data/catalog.json: metadatos por serie, período, fuente y SHA256.
- data/series/{id}.json: historia canónica y revisions[].
- public/series/{id}.json: lo que lee la ficha.
- public/mock-data/{app_metadata,timeline_events,summary_cards,charts_series}.json: los cuatro contratos de React.

Para producción, comprobar los mismos archivos bajo https://motorcl-economia-en-datos.vercel.app/. Comparar latestPeriod, valores y SHA/versiones de GitHub frente al contenido HTTP. HTTP 200 por sí solo no prueba frescura.

## Publicación automática de JSON

El workflow actualiza y valida JSON, ejecuta build y, si todo pasa, hace commit/push del snapshot al branch ejecutado con un bot de GitHub Actions. No genera una cadena infinita de jobs. Los motores no acceden a Vercel ni requieren su token.

Para automatizar el último eslabón en el proyecto Vercel existente:

1. Crear Deploy Hook de Vercel para el proyecto motorcl-economia-en-datos apuntando a main.
2. Guardar la URL completa como secreto de repositorio GitHub Actions con nombre VERCEL_DEPLOY_HOOK_URL.
3. Ejecutar la tarea manual. Tras el commit de JSON, verificar que el hook crea nuevo deployment de main en Vercel.
4. Comparar SHA del commit desplegado con el commit que publica datos. Hacer una lectura HTTP de al menos una observación actualizada.

Mientras no exista ese hook ni una integración Git activa, el job deja los datos actualizados en GitHub pero la web sigue en la última compilación. No confundir ambos estados.

## Incidencias y recuperación

- Si falla INE, usar historia válida anterior, marcar error y continuar con los demás adaptadores.
- Si falla Mindicador o devuelve valores futuros, unidades anómalas, duplicados contradictorios o datos fuera de rango, rechazar la ingesta de esa fuente y conservar el snapshot anterior, con aviso de retraso.
- Si falla validación o build, no publicar ningún JSON nuevo desde GitHub Actions.
- Si falla push a la rama protegida, revisar permisos de Actions (contents: write) y protecciones de main.
- Si Vercel queda desactualizado, revisar Deploy Hook o sincronización Git, no volver a descargar la API en el navegador.
- Para inspección histórica, comparar revisions[].detectedAt, previousValue y newValue.

## Regresión

El CI debe pasar npm run test:data y npm run build. Abrir dashboard, tarjeta, gráfico y ficha de INE, dólar, UF y TPM; probar descarga CSV y entradas directas /indicador/{id}; verificar que no aparecen cifras demostrativas.
