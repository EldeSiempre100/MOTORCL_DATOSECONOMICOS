# Motores de datos

Cada carpeta de fuente contiene un extractor independiente. Por ahora son plantillas: no descargan datos oficiales y no requieren credenciales para abrir la página.

| Carpeta | Fuente | Snapshot previsto |
| --- | --- | --- |
| `bcch_engine/` | Banco Central de Chile | `bcch_snapshot.json` |
| `ine_engine/` | INE | `ine_snapshot.json` |
| `dipres_engine/` | DIPRES | `dipres_snapshot.json` |
| `mds_nowcast_engine/` | MDS/CASEN | `mds_nowcast_snapshot.json` |

`engine_template.py` valida y escribe cada snapshot en `public/mock-data/` con su fuente y nombre propios. `schema_validator.py` aplica el contrato `engine_snapshot.schema.json`. Estos snapshots son archivos de preparación; la página consume únicamente `app_metadata.json`, `timeline_events.json`, `summary_cards.json` y `charts_series.json`. Falta implementar la consolidación entre ambos niveles.

Desde la raíz del proyecto, las dependencias del validador se instalan con `python -m pip install -r data-engines/requirements.txt`. Para validar un snapshot: `python data-engines/schema_validator.py public/mock-data/bcch_snapshot.json`.
