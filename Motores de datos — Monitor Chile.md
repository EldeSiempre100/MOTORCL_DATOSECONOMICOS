# Motores de datos — Monitor Chile

Cada fuente tiene una carpeta aislada con `engine_template.py`, su extractor de ejemplo y un README propio. Las plantillas no consultan organismos ni contienen credenciales. Para conectar una fuente, completar el extractor en un IDE y proporcionar sus credenciales como variables de entorno, nunca dentro del código.

## Contrato de instantánea por fuente

El motor crea un archivo de staging propio en `public/mock-data/`: `bcch_snapshot.json`, `ine_snapshot.json`, `dipres_snapshot.json` o `mds_nowcast_snapshot.json`. Cada snapshot cumple `engine_snapshot.schema.json` y tiene el siguiente sobre:

```json
{
  "schemaVersion": 1,
  "source": "BCCh",
  "generatedAt": "2026-10-19T00:00:00+00:00",
  "indicators": []
}
```

Cada elemento de `indicators` exige `id` (string estable), `name` (string), `period` (`YYYY-MM`, `YYYY-Qn` o `YYYY-Hn`), `value` (número o null), `unit`, `frequency` (`daily`, `monthly`, `quarterly`, `annual` o `rolling`) y `status` (`final`, `preliminary`, `estimated`, `revised` o `delayed`). Puede incluir `nameEn`, `category`, `publishedAt` ISO 8601, `sourceUrl` y `notes`. Consulte el JSON Schema para tipos y validación exactos.

Los cuatro snapshots son archivos separados para evitar que motores concurrentes sobrescriban una misma salida agregada. Una etapa de integración futura debe consolidarlos en los cuatro contratos consumidos por la web: `app_metadata.json`, `timeline_events.json`, `summary_cards.json` y `charts_series.json`. `src/services/dataService.ts` lee exclusivamente esos cuatro contratos frontend y no los snapshots de staging.

Instalación del validador desde esta carpeta: `python -m pip install -r requirements.txt`. Luego valide con `python schema_validator.py` o indique rutas: `python schema_validator.py ../public/mock-data/bcch_snapshot.json`. El directorio estándar de salida es `public/mock-data/` en la raíz del proyecto.

Los archivos que ya vienen en `public/mock-data/` son ejemplos visuales demostrativos. No son publicaciones verificadas de BCCh, INE, DIPRES o MDS.
