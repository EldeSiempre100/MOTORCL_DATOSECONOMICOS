# INE — Instituto Nacional de Estadísticas

Motor aislado para IPC, desocupación de la Encuesta Nacional de Empleo (ENE), Índice de Actividad del Comercio (IAC) e Índices de Producción Industrial (IPI). `ine_extractor.py` es boilerplate y deja sin implementar la adquisición de datos. Configure endpoint, identificadores estadísticos, frecuencias y fecha de publicación a partir de la fuente oficial antes de producir una instantánea.

El nombre de salida de staging es `public/mock-data/ine_snapshot.json`. El sobre JSON contiene `schemaVersion: 1`, `source: "INE"`, `generatedAt` (fecha-hora ISO 8601 UTC) e `indicators[]`. Cada registro incluye `id`, `name`, `period` (`YYYY-MM`, `YYYY-Qn` o `YYYY-Hn`), `value` numérico o null, `unit`, `frequency` y `status`. El Schema compartido admite opcionalmente nombre inglés, categoría, URL, fecha de publicación y notas.

Los nombres de período, unidad y frecuencia se deben conservar según el indicador oficial; no interpolar fechas ni cifras. Validar con `python data-engines/schema_validator.py public/mock-data/ine_snapshot.json`. La etapa de integración posterior mapeará estos registros al JSON frontend consolidado.
