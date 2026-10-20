# MotorCL — Cobertura de motores y criterios estadísticos V4

Fecha de corte de esta implementación: 20 de octubre de 2026. Los valores y la disponibilidad actual se consultan en `public/data/catalog.json` y `public/data/ingestion-status.json`, no en esta documentación.

## Series activas

| Serie / familia | Definición publicable | Origen de ingesta | Grado de verificación |
|---|---|---|---|
| Desocupación | Tasa nacional trimestre móvil (%) | INE/SIMEL SDMX | Organismo emisor, directo |
| Dólar observado | CLP por dólar | Mindicador | Intermediario, con fechas, controles de unidad y caché de frescura |
| UF | CLP por UF | Mindicador | Intermediario, con fechas, controles de unidad |
| TPM | Nivel de tasa (%) | Mindicador | Intermediario, con fechas, controles de unidad |
| IPC general | **Índice** base 2023=100; NO variación mensual (%) | `economia_chile/app/datos/ipc.csv` | Datos publicados por repositorio tercero; último punto cotejado con SII (sep 2026: 113,59) |
| Imacec original | **Índice** 2018=100; NO tasa interanual desestacionalizada | `economia_chile/app/datos/imacec.csv` | Serie de índices recopilada de BCCh por tercero; punto control ago 2026: 109,1 |
| IPSA | Valores de índice agrupados por mes; NO cotización intradía | `economia_chile/app/datos/ipsa.csv` | Repositorio tercero, punto control sep 2026: 11.326,7 |
| Remuneraciones reales | Índice mensual; NO aumento salarial en % | `economia_chile/app/datos/remuneraciones.csv` | Repositorio tercero, punto control ago 2026: 110,16 |

Repositorio fuente: https://github.com/bastianolea/economia_chile

La fuente documenta licencia GPL-3.0 para su código. MotorCL no incorpora su código de scraper. Los valores de los CSV se importan como datos con cita visible al repositorio; se conserva la procedencia y la definición, y debe revisarse cualquier obligación de atribución/licencia aplicable a la redistribución de archivos.

## Bloqueos comprobados, no supuestos

- Las consultas de GitHub Actions a `https://indicadores.cl/api/v1/ipc.json` y `imacec.json` recibieron HTTP 403. El proveedor no está activo en la cadena de producción.
- Mindicador respondió con latencias variables y timeouts desde GitHub Actions. La política permite conservar un snapshot previo **solo** cuando su última observación respeta el umbral de frescura de la serie; registra `cached` y `partial`, nunca un falso `ok`.
- Los archivos `precio_cobre.csv` del repositorio tercero contienen marcadores de conflicto Git (`<<<<<<<`, `=======`, `>>>>>>>`) y se excluyen de la ingesta. No se rellena con un último valor arbitrario.
- Los datos regionales de `pib_regional.csv` requieren depuración de magnitudes, unidades, series y revisiones. No se integran automáticamente.

## Controles que bloquean publicación

- Descarga exitosa o snapshot previo fresco y trazable en fuentes existentes.
- IPC, Imacec original, IPSA y remuneraciones reales **se requieren actualizados directamente desde su repositorio público** para considerar el lote V4 válido.
- Rechazo de CSV con esquema inesperado, conflictos de Git, dimensiones incompatibles, fechas futuras, duplicados o valores fuera de límites.
- Comparación exacta con períodos de control previamente contrastados. Revisión manual si cambian revisiones legítimas de los organismos emisores.
- `npm run test:data` y `npm run build` obligatorios antes de que Actions comitee los JSON.
- Sin datos demostrativos en tarjetas o gráficos; el catálogo conserva fuente, unidad, última fecha, SHA256 y estatus.

## Pendientes de cobertura

Comercio exterior, finanzas públicas/DIPRES, pobreza, deuda y tasas de mercado, producción regional, serie IPC de variaciones oficiales desagregadas y datos IPSA diarios. Se necesitan contratos separados de frecuencia/unidad; los **índices** de esta fase no sustituyen ni la variación mensual del IPC ni la tasa interanual del Imacec.

## Verificación HTTP

La publicación requiere comprobar el catálogo, los 8 archivos JSON de series y los contratos de cards/charts en Vercel además del estado GitHub Actions. Un build `READY` no prueba una ingesta íntegra.
