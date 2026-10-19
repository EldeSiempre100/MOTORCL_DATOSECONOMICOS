# Monitor Chile

Panel web de indicadores económicos de Chile. La interfaz actual usa **datos demostrativos**; aún no está conectada a publicaciones oficiales.

## Estructura

```text
src/
  components/
    home/            Línea de tiempo, tarjetas y gráficos
    layout/          Navegación, filtros y pie de página
    modals/          Diálogo de series demoradas
  hooks/             Estado de filtros y URL
  services/          Lectura de los contratos de datos
  types/             Contratos TypeScript
  App.tsx            Composición de la página
  main.tsx           Entrada de React
  index.css          Estilos
public/
  mock-data/          Cuatro contratos JSON que consume la página
  monitor-chile-logo.svg
data-engines/
  bcch_engine/        Plantilla de extracción Banco Central
  ine_engine/         Plantilla de extracción INE
  dipres_engine/      Plantilla de extracción DIPRES
  mds_nowcast_engine/ Plantilla de extracción MDS/CASEN
  engine_template.py  Escritura común de snapshots
  schema_validator.py Validación de snapshots
  engine_snapshot.schema.json
docs/                  Diseño, planes y notas del proyecto
```

La página solo lee los JSON de `public/mock-data/` mediante `src/services/dataService.ts`. Cada motor Python está separado de React y, cuando se implemente, generará su propio snapshot antes de cualquier consolidación hacia los contratos de la interfaz. Los extractores actuales son plantillas y no consultan fuentes reales.

## Desarrollo local

```bash
npm install
npm run dev
```

Vite abre el sitio en `http://localhost:3000/`. Los datos de ejemplo se sirven desde `/mock-data/*.json`.

Para el contrato de los motores, consulta [data-engines/README.md](data-engines/README.md). Los documentos de diseño están en [docs/](docs/).
