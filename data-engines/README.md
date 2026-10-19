# Motores de datos

El motor activo es `ine_engine/simel.mjs`. Consulta directamente la API SDMX de INE/SIMEL con código `CL01:DF_TDES_SEXO(1.0)/M.TDES._T.AS` y obtiene la tasa de desocupación nacional para trimestres móviles mensuales. No se copió código de los repositorios técnicos examinados.

`update.mjs` coordina la descarga, validación, fusión con la historia en `data/series/`, detección de revisiones y generación de los cuatro contratos que React ya consume. Los datos publicados en `public/series/` sirven la ficha del indicador. `publications.json` contiene únicamente fechas y enlaces documentales comprobados. Los demás registros conservan `publishedAt: null`.

La primera ejecución descarga la historia completa. Las siguientes consultan una ventana reciente de 14 meses para detectar publicaciones nuevas o revisiones sin perder observaciones anteriores. La consulta fallida no reemplaza los archivos. El historial guarda `firstSeenAt`, `lastChangedAt` y la secuencia de revisiones detectadas; no afirma representar revisiones anteriores a la primera ingestión.

```bash
npm run update:data
npm run test:data
```

Las carpetas `bcch_engine/`, `dipres_engine/` y los scripts Python previos son plantillas. No producen datos oficiales en esta fase. CMF también queda pendiente. Los accesos de BCCh/CMF que exijan credenciales deberán usarse sólo en el proceso de adquisición mediante variables de entorno o GitHub Secrets.

Las comprobaciones del pipeline rechazan dimensiones, frecuencia, unidad, valor, duplicados y períodos inesperados del CSV. La fusión valida también el contrato de la serie, su cronología y sus revisiones. Los contratos JSON son estáticos para preservar la arquitectura del frontend. La investigación y los bloqueos están en [../docs/fuentes-fase2.md](../docs/fuentes-fase2.md).
