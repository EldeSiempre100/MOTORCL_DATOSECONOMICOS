import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { fetchUnemployment, SERIES_ID } from './ine_engine/simel.mjs';
import { incrementalStart, mergeHistory, readJson, writeJson } from './lib/history.mjs';
import { buildContracts } from './lib/contracts.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const publicData = resolve(root, 'public/mock-data');
const historyPath = resolve(root, `data/series/${SERIES_ID}.json`);
const publicSeriesPath = resolve(root, `public/series/${SERIES_ID}.json`);
const files = {
  metadata: 'app_metadata.json',
  timeline: 'timeline_events.json',
  summaries: 'summary_cards.json',
  charts: 'charts_series.json',
};

async function main() {
  const previous = await readJson(historyPath);
  const start = incrementalStart(previous);
  const incoming = await fetchUnemployment(start);
  const registry = await readJson(resolve(root, 'data-engines/ine_engine/publications.json'), {});
  const checkedAt = new Date().toISOString();
  const { series, newCount, revisedCount } = mergeHistory(previous, incoming, registry, checkedAt);
  const baseline = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([key, name]) =>
    [key, await readJson(resolve(publicData, name))])));
  if (Object.values(baseline).some((item) => item === null)) throw new Error('Faltan contratos JSON del frontend');
  const contracts = buildContracts(baseline, series, checkedAt);
  const status = {
    schemaVersion: 1,
    lastSuccessfulRefresh: checkedAt,
    source: 'INE/SIMEL',
    seriesId: SERIES_ID,
    observations: series.observations.length,
    latestPeriod: series.observations.at(-1).period,
    newObservations: newCount,
    revisedObservations: revisedCount,
    requestedFrom: start ?? 'inicio de la serie',
  };

  // Fetch and validate everything before touching the published files.
  await writeJson(historyPath, series);
  await writeJson(publicSeriesPath, series);
  for (const [key, name] of Object.entries(files)) await writeJson(resolve(publicData, name), contracts[key]);
  await writeJson(resolve(root, 'data/ingestion-status.json'), status);
  console.log(JSON.stringify(status, null, 2));
}

main().catch((error) => {
  console.error(`No se actualizaron los datos: ${error.message}`);
  process.exitCode = 1;
});
