# Motores de datos MotorCL (multifuente)

## Estado operativo

- **INE/SIMEL — oficial directo:** tasa de desocupación nacional, SDMX `CL01:DF_TDES_SEXO(1.0)/M.TDES._T.AS`, trimestres móviles. Se preserva el motor y el linaje original.
- **Mindicador — intermediario público, sin API Key:** dólar observado, UF y TPM. Se registran como `sourced`, **no** como respuesta oficial autenticada del BCCh. Mindicador atribuye su información al BCCh.
- **Demás fuentes:** no se publican como datos reales ni se conservan valores de demostración en el dashboard. Las carpetas anteriores `bcch_engine/`, `dipres_engine/`, `mds_nowcast_engine/` siguen siendo plantillas, no motores habilitados.

## Actualización

```sh
npm ci
npm run update:data
npm run test:data
npm run build
```

`update.mjs` ejecuta cada motor independientemente. La extracción de Mindicador usa `/api/{codigo}/{año}` para reconstruir historial y `/api/{codigo}` para verificar el último mes. Descarta fechas futuras, rechaza datos fuera de rango y no confunde fecha observada con publicación.

El historial vive en `data/series/{id}.json`, con `firstSeenAt`, `lastChangedAt` y `revisions[]` detectadas desde que empezó el registro. Los cambios anteriores a la primera consulta no se inventan. Los JSON para React se publican en `public/series/` y `public/mock-data/`. El nombre `mock-data` se conserva por compatibilidad de rutas; su contenido publicado ya no incluye cifras demostrativas.

`public/data/catalog.json` inventaría series, fuentes, períodos, unidades, SHA256 y fecha de sincronización. `public/data/ingestion-status.json` registra éxito, error y frescura por motor.

Si una fuente falla, conserva el último historial verificado, lo marca en el registro de retrasos y no rellena con ceros. La publicación de cambios sucede **solo tras** validación del pipeline.

## GitHub Actions y Vercel

`.github/workflows/update-data.yml` se ejecuta diariamente a las **12:00 UTC**, manualmente o por cambios al motor. Comprueba ingesta, tests y build y crea un commit de JSON validados. Los commits automáticos llevan `[skip ci]` para evitar ciclos de ejecución.

**Para cerrar la publicación web desatendida:** registrar un Deploy Hook **de este mismo proyecto MotorCL** en Vercel, apuntando a `main`, y guardarlo como secreto de GitHub Actions `VERCEL_DEPLOY_HOOK_URL`. Sin ese secreto, la actualización de GitHub sí funciona, pero la versión pública de Vercel no se recompila por sí sola mientras el proyecto no tenga sincronización Git automática. Nunca guardar la URL secreta en el repositorio.

La verificación correcta implica **tres pasos independientes**: ejecución del motor, JSON versionado en GitHub y lectura HTTP del nuevo período y valor en Vercel. Ver `docs/runbook-actualizacion.md`.
