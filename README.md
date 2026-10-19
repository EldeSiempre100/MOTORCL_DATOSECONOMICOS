# MotorCL — Economía en Datos

Monitor de indicadores económicos chilenos en React, TypeScript y Vite. La vista principal conserva sus componentes y filtros originales. En esta fase, **la tasa de desocupación nacional** se alimenta de INE/SIMEL; el resto de las cifras sigue etiquetado como ejemplo.

## Desarrollo local

```bash
npm ci
npm run update:data
npm run dev
```

`npm run update:data` consulta el endpoint oficial de INE, conserva la historia en `data/series/`, publica una copia navegable en `public/series/` y regenera los cuatro contratos JSON de `public/mock-data/`. Para comprobar las transformaciones y la compilación:

```bash
npm run test:data
npm run build
```

La actualización requiere Node 20 o superior y conexión a Internet. El frontend no consulta la API ni usa credenciales: lee archivos estáticos. Si la consulta falla, el proceso sale con error y conserva los últimos datos publicados.

## Estructura

```text
src/components/          Vista principal y ficha de indicador
src/hooks/               Estado de filtros y URL
src/services/            Lectura de contratos JSON y series
src/types/               Contratos TypeScript
public/mock-data/        Cuatro contratos de la vista principal
public/series/           Serie histórica pública para la ficha
data/series/             Historia canónica y revisiones detectadas
data/ingestion-status.json Última actualización exitosa
data-engines/ine_engine/ Conector INE/SIMEL y registro documental
data-engines/lib/        Persistencia y adaptación a los contratos React
data-engines/tests/      Pruebas de ingestión y transformaciones
.github/workflows/      Actualización programada y artefacto revisable
docs/                   Investigación de fuentes y decisiones
```

La ficha de la serie oficial está en `/indicador/ine.ene.tdes.nacional.total`. Muestra nivel, períodos observados, fechas de publicación conocidas, cambios en puntos porcentuales, historia y descarga CSV. Una fecha de publicación ausente se muestra como desconocida; la fecha de consulta del sistema se guarda por separado.

## Fuentes y límites

La integración activa, código oficial, método de consulta y repositorios técnicos examinados están documentados en [docs/fuentes-fase2.md](docs/fuentes-fase2.md). BCCh, CMF y DIPRES aún no están conectados. No se requiere ni incluye ninguna credencial. Los extractores Python anteriores permanecen como plantillas sin adquisición activa; el pipeline funcional de esta fase es Node.

El workflow diario ejecuta la adquisición y ofrece los archivos generados como artefacto para revisión. No hace commit ni push. La publicación de nuevas cifras requiere incorporarlas al repositorio o al despliegue después de revisarlas.
